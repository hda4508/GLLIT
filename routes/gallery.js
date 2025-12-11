// routes/gallery.js
const express = require("express");
const router = express.Router();
const Gallery = require("../models/Gallery");

function requireLogin(req, res, next) {
    if (req.session.user) return next();
    return res.redirect("/?needLogin=1");
}

// ----------------------------------------------
// 멤버 갤러리 페이지
// ----------------------------------------------
router.get("/:member", requireLogin, async (req, res) => {
    try {
        const member = req.params.member.toLowerCase();

        let gallery = await Gallery.findOne({ member });

        if (!gallery) {
            gallery = await Gallery.create({
                member,
                photos: []
            });
        }

        res.render("gallery", {
            siteTitle: `${member} gallery`,
            member,
            photos: gallery.photos,
            user: req.session.user
        });

    } catch (err) {
        console.error("갤러리 페이지 오류:", err);
        res.status(500).send("Internal Server Error");
    }
});

// ----------------------------------------------
//  url로 사진 첨부
// ----------------------------------------------
router.post("/add", requireLogin, async (req, res) => {
    try {
        const { member, url } = req.body;

        if (!member || !url) {
            return res.json({ success: false, message: "데이터 부족" });
        }

        const gallery = await Gallery.findOne({ member });

        if (!gallery) {
            return res.json({ success: false, message: "갤러리 없음" });
        }

        gallery.photos.push({
            imageUrl: url,
            authorId: req.session.user.id,
            authorNickname: req.session.user.nickname,
            createdAt: new Date()
        });

        await gallery.save();

        res.json({ success: true });

    } catch (err) {
        console.error("사진 추가 오류:", err);
        res.status(500).json({ success: false });
    }
});

// ----------------------------------------------
//  삭제
// ----------------------------------------------
router.post("/delete/:photoId", requireLogin, async (req, res) => {
    try {
        const { photoId } = req.params;

        const gallery = await Gallery.findOne({ "photos._id": photoId });

        if (!gallery) {
            return res.json({ success: false, message: "사진 없음" });
        }

        const targetPhoto = gallery.photos.id(photoId);

        if (!targetPhoto) {
            return res.json({ success: false, message: "사진 없음" });
        }

        // 올린 사람만 삭제 가능하게
        if (String(targetPhoto.authorId) !== String(req.session.user.id)) {
            return res.json({ success: false, message: "권한 없음" });
        }

        await Gallery.updateOne(
            { "photos._id": photoId },
            { $pull: { photos: { _id: photoId } } }
        );

        res.json({ success: true });

    } catch (err) {
        console.error("삭제 실패:", err);
        res.json({ success: false });
    }
});

module.exports = router;
