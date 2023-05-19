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
   

});

userSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.password;
        delete ret.__v;
    }
});
const User = mongoose.model('User', userSchema);

module.exports = User;
