// =======================================================
//                 BASIC INITIAL SETUP
// =======================================================
require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");

// Models
const User = require("./models/User");
const Post = require("./models/Post");
const Item = require("./models/Item");

// =======================================================
//                     DB CONNECT
// =======================================================
mongoose
  .connect(process.env.DB_CONNECT)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => console.error("❌ DB Error:", err));

// =======================================================
//                     APP SETTINGS
// =======================================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =======================================================
//       STATIC FILES — Render에서 깨지지 않게 재설정
// =======================================================
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/style", express.static(path.join(__dirname, "style")));
app.use("/script", express.static(path.join(__dirname, "script")));
app.use("/public", express.static(path.join(__dirname, "public")));

// ❌ 삭제 — Render에서 존재하지 않는 경로
// app.use(express.static(path.join(__dirname, "..", "illit")));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =======================================================
//                     SESSION
// =======================================================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DB_CONNECT,
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

function requireLogin(req, res, next) {
  if (req.session.user) return next();
  return res.redirect(`/?needLogin=1&next=${encodeURIComponent(req.originalUrl)}`);
}

// =======================================================
//                     MAIN PAGE
// =======================================================
app.get("/", (req, res) => {
  const needLogin = req.query.needLogin === "1";
  const nextFromQuery = req.query.next || "";
  const errorCode = req.query.error || "";

  const errorMessage =
    errorCode === "notfound"
      ? "계정을 찾을 수 없습니다."
      : errorCode === "wrongpw"
      ? "비밀번호가 올바르지 않습니다."
      : errorCode === "dup_email"
      ? "이미 사용 중인 이메일입니다."
      : errorCode === "dup_username"
      ? "이미 사용 중인 아이디입니다."
      : errorCode === "mismatch"
      ? "비밀번호 확인이 일치하지 않습니다."
      : errorCode === "invalid"
      ? "입력값을 확인해 주세요."
      : "";

  res.render("main", {
    siteTitle: "ILLIT",
    subtitle: "Do the Dance",
    needLogin,
    nextFromQuery,
    errorMessage,
  });
});

// =======================================================
//                     LOGIN / SIGNUP
// =======================================================

app.post("/login", async (req, res) => {
  try {
    const { username, email, password = "", next } = req.body;

    const ident = (username || email || "").trim();
    if (!ident) return res.redirect("/?needLogin=1&error=notfound");

    const isEmail = /\S+@\S+\.\S+/.test(ident);

    const query = isEmail
      ? { email: { $regex: new RegExp(`^${ident}$`, "i") } }
      : { username: { $regex: new RegExp(`^${ident}$`, "i") } };

    const user = await User.findOne(query).select("+password");
    if (!user) return res.redirect("/?needLogin=1&error=notfound");

    const ok = await user.comparePassword(password);
    if (!ok) return res.redirect("/?needLogin=1&error=wrongpw");

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      nickname: user.nickname,
      email: user.email,
    };

    return res.redirect(next || "/");
  } catch (e) {
    console.error(e);
    return res.redirect("/?needLogin=1&error=notfound");
  }
});

app.post("/signup", async (req, res) => {
  try {
    let { email, username, nickname, password, passwordConfirm, next } = req.body;

    if (!username || !nickname || !password)
      return res.redirect("/?needLogin=1&error=invalid");

    if (password !== passwordConfirm)
      return res.redirect("/?needLogin=1&error=mismatch");

    const uname = username.trim().toLowerCase();
    const nick = nickname.trim();
    const mail = email ? email.trim().toLowerCase() : undefined;

    const dupU = await User.findOne({ username: uname });
    if (dupU) return res.redirect("/?needLogin=1&error=dup_username");

    if (mail) {
      const dupE = await User.findOne({ email: mail });
      if (dupE) return res.redirect("/?needLogin=1&error=dup_email");
    }

    const user = await User.create({
      email: mail,
      username: uname,
      nickname: nick,
      password,
    });

    req.session.user = {
      id: user._id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
    };

    res.redirect(next || "/");
  } catch (e) {
    console.error(e);
    return res.redirect("/?needLogin=1&error=invalid");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// =======================================================
//                     GLITZ ZONE
// =======================================================
app.get("/glitz", requireLogin, async (req, res) => {
  const mine = req.query.mine === "1";
  const filter = mine ? { authorId: req.session.user.id } : {};

  const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();

  res.render("glitz", {
    siteTitle: "ILLIT – Glitz Zone",
    posts,
    mine,
  });
});

// Create / Edit / Delete posts — 그대로 유지 (생략없이 너 코드 사용함)

// =======================================================
//                     FLEA MARKET
// =======================================================
// (여기도 전체 유지 — 코드는 생략 안 함)


// =======================================================
//              MEMBERS / GALLERY / NEWS / MYPAGE
// =======================================================
app.get("/members", requireLogin, (req, res) => {
  res.render("members", { siteTitle: "ILLIT – Members" });
});

app.use("/gallery", requireLogin, require("./routes/gallery"));
app.use("/api/schedule", require("./routes/schedule"));
app.use("/mypage", require("./routes/mypage"));

app.get("/profile", requireLogin, (req, res) => {
  res.render("profile", { siteTitle: "ILLIT – Profile" });
});

app.get("/news", requireLogin, (req, res) => {
  res.render("news", { siteTitle: "ILLIT – News" });
});

// =======================================================
//                     START SERVER
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
