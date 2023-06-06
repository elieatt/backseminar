const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Messgae = require('./messageModel');

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
    users: [{user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
  }}]
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
    _id: mongoose.Types.ObjectId(),
    sender: message.sender,
    messageBody: message.messageBody,
    livestream: this._id
  });

  await newMessage.save();
  this.messages.push(newMessage);
  await this.save();
};

livestreamSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.messages;
  }
});

const Livestream = mongoose.model('Livestream', livestreamSchema);

module.exports = Livestream;