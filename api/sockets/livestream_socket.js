const socketIO = require('socket.io');
const Livestream = require('../models/livestreamingModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const liveStreamCreationSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  broadcaster: Joi.string().required(),
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
    //console.log('A new client has connected to /live');
    //console.log("another socket id " + socket.id);

    // Send alllivestreams to the new client on connection
    Livestream.find().populate({ path: 'broadcaster', model: 'User' }).then((livestreams) => {
      //console.log('init ', livestreams);
      socket.emit('init', livestreams);
    });

    socket.on('create', async (data) => {
      try {
        const { error, value } = liveStreamCreationSchema.validate(data);

        if (error) {
          // Send the validation error to the client
          socket.emit('createError', error.message);
          return;
        } else {
          const userBroadcster = await User.findById(data.broadcaster);
          console.log(userBroadcster);
          if (userBroadcster == null || userBroadcster.livestream != null) {
            socket.emit('createError');
            //console.log("hi elie");
            return;
          }
          const newLiveStream = new Livestream({
            _id: new mongoose.Types.ObjectId(),
            title: data.title,
            description: data.description,
            broadcaster: data.broadcaster,
            imageUrl: data.imageUrl,
          });
          newLiveStream.save().then((nlivestream) => {
            Livestream.populate(nlivestream, { path: 'broadcaster', model: 'User' }).then(populatedLivestream => {
              User.findByIdAndUpdate(nlivestream.broadcaster, { livestream: nlivestream._id }).then(() => {
                //console.log(populatedLivestream);
                socket.emit('createSucceed', populatedLivestream);
                liveStreamIO.emit('create', populatedLivestream);
              });
            });
          });

        }
      } catch (e) {
        //console.log(e);
        socket.emit('createError', e.message);
      }
    });

    socket.on('disconnect', () => {
      //console.log('A client has disconnected from /live');

      // Get the ID of the disconnected user
      const userId = socket.payload.id;

      // Find the user document with the corresponding ID
      User.findById(userId).populate('livestream').then((user) => {
        if (!user || !user.livestream) {
          return;
        }
        const tobeDeletedLivestreamId = user.livestream._id;
        // Delete the livestream document from the database
        Livestream.findByIdAndDelete(tobeDeletedLivestreamId).then(() => {
          //console.log(tobeDeletedLivestreamId);
          // Update the user document with null livestream field
          user.livestream = null;
          user.save().then(() => {
            // Notify all clients that the livestream has ended.
            liveStreamIO.emit('end', tobeDeletedLivestreamId);
          });
        });
      });
    });
  });
}

module.exports = setupSocketIO;