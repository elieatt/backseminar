const socketIO = require('socket.io');
const Livestream = require('../models/livestreamingModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const liveStreamCreationSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  broadcaster: Joi.number().required(),
  imageUrl: Joi.string().allow(null).optional()

});

function setupSocketIO(server) {
  const io = socketIO(server);

  const liveStreamIO = io.of('/live');
  // Middleware to authenticate the socket connection
  liveStreamIO.use((socket, next) => {
    const token = socket.handshake.auth.token;

    jwt.verify(token, process.env.JWTPRIVATE, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }

      // Add the decoded userId object to the socket for future use
      socket.payload = decoded;
      /*  //console.log(socket.payload.id);
       //console.log("socket ID is " + socket.id); */
      next();
    });
  });

  // Event handler for the /live namespace
  liveStreamIO.on('connection', (socket) => {

    Livestream.find().populate({ path: 'broadcaster', model: 'User' }).populate({ path: 'viewers.users.user', select: 'name email uuid', model: 'User' }).then((livestreams) => {

      socket.emit('init', livestreams);
    });



    socket.on('disconnect', async () => {
      const userUuid = socket.payload.uuid;

      try {
        // Find the user document with the corresponding ID
        const user = await User.findOne({ uuid: userUuid }).populate('livestream');

        if (!user || !user.livestream) {
          return;
        }

        const tobeDeletedLivestreamId = user.livestream._id;

        // Delete the livestream document from the database
        await Livestream.deleteOne({_id:tobeDeletedLivestreamId});


        // Update the user document with null livestream field
        user.livestream = null;
        await user.save();

        // Notify all clients that the livestream has ended.
        liveStreamIO.emit('end', tobeDeletedLivestreamId);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('create', async (data) => {
      try {
        const { error, value } = liveStreamCreationSchema.validate(data);

        if (error) {
          // Send the validation error to the client
          socket.emit('createError', error.message);
          return;
        } else {
          const userBroadcster = await User.findOne({ uuid: data.broadcaster });
          //console.log(userBroadcster);
          if (userBroadcster == null || userBroadcster.livestream != null) {
            socket.emit('createError');
            //console.log("hi elie");
            return;
          }
          const newLiveStream = new Livestream({
            _id: new mongoose.Types.ObjectId(),
            title: data.title,
            description: data.description,
            broadcaster: userBroadcster._id,
            imageUrl: data.imageUrl,
          });

          let nlivestream = await newLiveStream.save();
          await User.findByIdAndUpdate(nlivestream.broadcaster, { livestream: nlivestream._id });
          nlivestream = await Livestream.findById(newLiveStream._id).populate({ path: 'broadcaster', model: 'User' }).populate({ path: 'viewers.users.user', select: 'name email uuid', model: 'User' });

          socket.join(`${nlivestream._id}`);
          socket.emit('createSucceed', nlivestream);
          liveStreamIO.emit('create', nlivestream);

        }
      } catch (e) {
        console.log(e);
        socket.emit('createError', e.message);
      }
    });

    socket.on('join-livestream', async (lsID) => {

      try {
        const fetchedLivestream = await Livestream.findById(lsID);
        const joinedUser = await User.findOne({ uuid: socket.payload.uuid });
        await fetchedLivestream.addViewer(joinedUser);
        let livestreamAfterJoin = await Livestream.findById(fetchedLivestream._id).populate({ path: 'broadcaster', model: 'User' }).populate({ path: 'viewers.users.user', select: 'name email uuid', model: 'User' });
        socket.join(`${fetchedLivestream._id}`);
        socket.emit('join-success');
        console.log(socket.rooms);

        liveStreamIO.emit('update-livestreams', livestreamAfterJoin);
        //socket.join(lsID);
      } catch (e) {
        console.log(e);

        socket.emit('join-error');

      }


    });


    socket.on('leave-livestraem', async (lsId) => {
      try {
        const fetchedLivestream = await Livestream.findById(lsId);
        const userToLeave = await User.findOne({ uuid: socket.payload.uuid });
        socket.leave(`${fetchedLivestream._id}`);
        if (userToLeave._id.equals(fetchedLivestream.broadcaster)) {


          // Delete the livestream document from the database
          await Livestream.deleteOne({_id:fetchedLivestream._id});

          // Update the user document with null livestream field
          userToLeave.livestream = null;
          await userToLeave.save();

          // Notify all clients that the livestream has ended.
          liveStreamIO.emit('end', fetchedLivestream._id);
          return;
        }
        await fetchedLivestream.removeViewer(userToLeave);
        let lsAfterLeaving = await Livestream.findById(fetchedLivestream._id).populate({ path: 'broadcaster', model: 'User' }).populate({ path: 'viewers.users.user', select: 'name email uuid', model: 'User' });
        //console.log(lsAfterLeaving);
        liveStreamIO.emit('update-livestreams', lsAfterLeaving);
        socket.emit('leave-success');
      } catch (e) {
        console.log(e);
        socket.emit('leave-error');
      }

    });
    socket.on('send-message', async (message, roomID, callback) => {
      try {
        const sender = await User.findOne({ uuid: socket.payload.uuid });
        const messageToSave = {
          senderUIID: socket.payload.uuid,
          messageBody: message,
          senderName: sender.name
        }
        const liveStreamfet = await Livestream.findById(roomID);
        const savedMessage = await liveStreamfet.addMessage(messageToSave);
        callback({ sent: true });
        liveStreamIO.to(roomID).emit('recive-message', savedMessage);
      } catch (e) {
        console.log(e);
        callback({ sent: false });
      }
    });
  });
}

module.exports = setupSocketIO;