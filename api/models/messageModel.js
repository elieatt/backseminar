const mongoose = require('mongoose');
const messageSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        messageBody: String,
        liveStream:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Livestream'
        }


    }
);
const Message = mongoose.model('Message',messageSchema);
module.exports=Message;