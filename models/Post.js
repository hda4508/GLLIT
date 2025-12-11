// myContacts/models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    // 로그인 및 작성자
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    // 글릿존 닉네임
    authorNickname: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },

    // 기본 말풍선
    isSeed: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

module.exports = mongoose.model("Post", postSchema);