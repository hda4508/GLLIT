const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },

    // ⭐ 작성자 정보 추가
    authorId: { type: String, required: true },
    authorNickname: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }
});

const gallerySchema = new mongoose.Schema({
    member: { type: String, required: true },
    photos: [photoSchema]
});

module.exports = mongoose.model("Gallery", gallerySchema);
