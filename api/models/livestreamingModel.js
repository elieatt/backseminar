const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Message = require('./messageModel');

/* const viewerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}); */
const messageSchema = new Schema({
  message: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }
});


const livestreamSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: false,
    default: "https://thumbs.dreamstime.com/b/live-stream-logo-design-vector-illustration-design-template-live-stream-logo-design-vector-illustration-161152543.jpg"
  },
  viewers: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  messages: [messageSchema],
  broadcaster: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: String,
    default: () => new Date().toISOString(),
  },

});

livestreamSchema.methods.addViewer = async function (user) {
  const viewers = this.viewers;
  const index = viewers.users.findIndex((viewer) => viewer.user.toString() === user._id.toString());
  if (index === -1) {
    viewers.count += 1;
    viewers.users.push({ user: user._id });
    await this.save();
  }
};

livestreamSchema.methods.removeViewer = async function (user) {
  const viewers = this.viewers;
  const index = viewers.users.findIndex((viewer) => viewer.user.toString() === user._id.toString());
  if (index !== -1) {
    viewers.count -= 1;
    viewers.users.splice(index, 1);
    await this.save();
  }
};
livestreamSchema.methods.addMessage = async function (message) {
  const newMessage = new Message({
    _id: new mongoose.Types.ObjectId(),
    senderUIID: message.senderUIID,
    messageBody: message.messageBody,
    liveStream: this._id,
    senderName: message.senderName
  });

  await newMessage.save();
  this.messages.push({ message: newMessage }); // add the new Message object to the messages array
  await this.save();
  return newMessage;
};

livestreamSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.messages;
  }
});
livestreamSchema.pre(/^delete/, async function (next) {
  try {
    // Remove all messages associated with this livestream
    var livestreamId = this.getFilter()['_id'];;

    await Message.deleteMany({ liveStream: livestreamId });

    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
});

const Livestream = mongoose.model('Livestream', livestreamSchema);

module.exports = Livestream;