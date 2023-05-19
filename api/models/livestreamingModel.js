const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const livestreamSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  viewers: {
    type: Number,
    default: 0
  },
  broadcaster: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

livestreamSchemaset('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    //  delete ret._id;
    delete ret.__v;
  }
});

const Livestream = mongoose.model('Livestream', livestreamSchema);

module.exports = Livestream;