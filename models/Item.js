const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    authorNickname: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        default: null
    },

    location: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    description: { 
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Item", itemSchema);
