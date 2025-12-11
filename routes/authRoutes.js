const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { register, login, logout, me } = require("../controllers/authController");

// 회원가입 / 로그인 / 로그아웃 / 내 정보
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, me);

module.exports = router;
