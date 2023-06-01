const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const viewerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
    users: [viewerSchema]
  },
  broadcaster: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: String,
    default: () => new Date().toISOString(),
  }
});

livestreamSchema.methods.addViewer = function (user) {
  const viewers = this.viewers;
  const index = viewers.users.findIndex((viewer) => viewer.user.toString() === user._id.toString());
  if (index === -1) {
    viewers.count += 1;
    viewers.users.push({ user: user._id });
  }
};

livestreamSchema.methods.removeViewer = function (user) {
  const viewers = this.viewers;
  const index = viewers.users.findIndex((viewer) => viewer.user.toString() === user._id.toString());
  if (index !== -1) {
    viewers.count -= 1;
    viewers.users.splice(index, 1);
  }
};

livestreamSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
  }
});

const Livestream = mongoose.model('Livestream', livestreamSchema);

module.exports = Livestream;