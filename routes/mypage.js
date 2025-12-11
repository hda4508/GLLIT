// routes/mypage.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");   // ⭐ 글릿존(Post) 가져오기
const Item = require("../models/Item");   // ⭐ 앨범(Item) 가져오기
const bcrypt = require("bcryptjs");

// 🔒 로그인 필수 미들웨어
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  return res.redirect("/?needLogin=1");
}

// ===============================
//      마이페이지 메인
// ===============================
router.get("/", requireLogin, (req, res) => {
  res.render("mypage", {
    siteTitle: "마이페이지",
    user: req.session.user,
  });
});


// ===============================
//      닉네임 변경
// ===============================
router.post("/nickname", requireLogin, async (req, res) => {
  try {
    const newNick = req.body.nickname.trim();

    if (newNick.length < 2 || newNick.length > 24)
      return res.redirect("/mypage?error=invalid_nick");

    // ⭐ User DB 업데이트
    await User.updateOne(
      { _id: req.session.user.id },
      { $set: { nickname: newNick } }
    );

    // ⭐ 세션에도 반영
    req.session.user.nickname = newNick;

    // ⭐ 글릿존(Post) 모든 댓글 닉네임 업데이트
    await Post.updateMany(
      { authorId: req.session.user.id },
      { $set: { authorNickname: newNick } }
    );

    // ⭐ 앨범(Item) 작성자명 업데이트
    await Item.updateMany(
      { authorId: req.session.user.id },
      { $set: { authorNickname: newNick } }
    );

    return res.redirect("/mypage?updated=nick");
  } catch (err) {
    console.error("Nickname update error:", err);
    return res.redirect("/mypage?error=fail");
  }
});


// ===============================
//      아이디 변경
// ===============================
router.post("/username", requireLogin, async (req, res) => {
  try {
    const username = req.body.username.trim().toLowerCase();
    if (!username) return res.redirect("/mypage");

    const exists = await User.findOne({ username });
    if (exists && exists._id.toString() !== req.session.user.id)
      return res.redirect("/mypage?error=username_taken");

    await User.updateOne({ _id: req.session.user.id }, { username });

    // ⭐ 세션 갱신
    req.session.user.username = username;

    res.redirect("/mypage?updated=username");
  } catch (err) {
    console.error(err);
    res.redirect("/mypage?error=fail");
  }
});


// ===============================
//      비밀번호 변경
// ===============================
router.post("/password", requireLogin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.session.user.id).select("+password");

    // 기존 비밀번호 확인
    const ok = await user.comparePassword(oldPassword);
    if (!ok) return res.redirect("/mypage?error=wrongpw");

    user.password = newPassword; // pre-save에서 자동 해시됨
    await user.save();

    res.redirect("/mypage?updated=password");
  } catch (err) {
    console.error(err);
    res.redirect("/mypage?error=fail");
  }
});

module.exports = router;
