const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
  
    },
    password: {
      type: String,
      required: true,
  
    },
    livestream: {
      type:mongoose.Schema.Types.ObjectId,
      ref: 'Livestream'
    }
  });
  
  userSchema.set('toJSON', {
    virtuals: true,
    transform:(doc, ret) => {
      delete ret.password;
      delete ret.livestream;
     // delete  ret._id;//the id not _id is still in the response
      delete ret.__v;
    }
  });
  
  const User = mongoose.model('User', userSchema);

module.exports = User;
