const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const makeToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax", 
    secure: false,   
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "email, password, name은 필수입니다." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "이미 가입된 이메일입니다." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name });

    const token = makeToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      message: "회원가입 완료",
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });

    const token = makeToken(user._id);
    setAuthCookie(res, token);

    res.json({
      message: "로그인 성공",
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (_req, res, _next) => {
  res.clearCookie("token");
  res.json({ message: "로그아웃 완료" });
};

exports.me = async (req, res, _next) => {
  res.json({ user: req.user });
};
