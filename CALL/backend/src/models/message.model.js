import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    meetingCode: {
        type: String,
        required: true,
        index: true
    },
    sender: {
        type: String,
        required: true
    },
    senderSocketId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    fileName: {
        type: String
    },
    fileUrl: {
        type: String
    },
    fileSize: {
        type: Number
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    reactions: [{
        username: { type: String, required: true },
        emoji: { type: String, required: true }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    readers: [{
        type: String
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
