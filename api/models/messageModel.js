const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        senderUIID: {
            type: Number,
            required: true,

        },
        messageBody: {
            type: String,
            maxlength: 150
        },
        senderName: {
            type: String, 
            required: true
        },

        liveStream: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Livestream',
            required: true
        },
        sentAt: {
            type: String,
            default: () => new Date().toISOString(),
        },


    }
);
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;