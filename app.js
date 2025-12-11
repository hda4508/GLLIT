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
    console.log("DB name:", mongoose.connection.name);
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));


// =======================================================
//                     APP SETTINGS
// =======================================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use("/img", express.static(path.join(__dirname, "img")));
app.use(express.static(path.join(__dirname, "..", "illit")));
app.use(express.static(path.join(__dirname, "public"))); // gallery용

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

// 로그인
app.post("/login", async (req, res) => {
  try {
    const { username, email, password = "", next } = req.body;
    const identRaw = (username ?? email ?? "").trim();

    if (!identRaw) return res.redirect("/?needLogin=1&error=notfound");

    const isEmail = /\S+@\S+\.\S+/.test(identRaw);

    const query = isEmail
      ? { email: { $regex: new RegExp(`^${identRaw}$`, "i") } }
      : { username: { $regex: new RegExp(`^${identRaw}$`, "i") } };

    const user = await User.findOne(query).select("+password");
    if (!user) return res.redirect("/?needLogin=1&error=notfound");

    const ok = await user.comparePassword(password);
    if (!ok) return res.redirect("/?needLogin=1&error=wrongpw");

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      nickname: user.nickname,
      email: user.email || "",
    };

    return res.redirect(next || "/");
  } catch (e) {
    console.error(e);
    return res.redirect("/?needLogin=1&error=notfound");
  }
});


// 회원가입
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

    const dupU = await User.findOne({
      username: { $regex: new RegExp(`^${uname}$`, "i") },
    }).lean();
    if (dupU) return res.redirect("/?needLogin=1&error=dup_username");

    if (mail) {
      const dupE = await User.findOne({
        email: { $regex: new RegExp(`^${mail}$`, "i") },
      }).lean();
      if (dupE) return res.redirect("/?needLogin=1&error=dup_email");
    }

    const user = await User.create({
      email: mail,
      username: uname,
      nickname: nick,
      password,
    });

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      nickname: user.nickname,
      email: user.email || "",
    };

    return res.redirect(next || "/");
  } catch (e) {
    console.error(e);
    return res.redirect("/?needLogin=1&error=invalid");
  }
});

// 로그아웃
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

// 🔥 글릿 닉네임 변경 기능 삭제됨 (요청에 따라 완전 삭제)

app.post("/glitz/post", requireLogin, async (req, res) => {
  try {
    const trimmed = req.body.content.trim();
    if (!trimmed) return res.redirect("/glitz");

    await Post.create({
      authorId: req.session.user.id,
      authorNickname: req.session.user.nickname,
      content: trimmed,
    });

    res.redirect("/glitz");
  } catch (e) {
    console.error(e);
    res.redirect("/glitz");
  }
});

app.post("/glitz/edit/:id", requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect("/glitz");

    if (String(post.authorId) !== req.session.user.id)
      return res.redirect("/glitz");

    const trimmed = req.body.content.trim();
    if (!trimmed) return res.redirect("/glitz");

    post.content = trimmed;
    await post.save();

    res.redirect("/glitz?mine=1");
  } catch (e) {
    console.error(e);
    res.redirect("/glitz");
  }
});

app.post("/glitz/delete/:id", requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.redirect("/glitz");

    if (String(post.authorId) !== String(req.session.user.id))
      return res.redirect("/glitz");

    await Post.deleteOne({ _id: post._id });

    res.redirect("/glitz");
  } catch (e) {
    console.error(e);
    res.redirect("/glitz");
  }
});


// =======================================================
//                     FLEA MARKET
// =======================================================
app.get("/albums", requireLogin, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }).lean();

    res.render("albums", {
      siteTitle: "ILLIT – Flea Market",
      items,
    });
  } catch (e) {
    console.error("Album load error:", e);

    res.render("albums", {
      siteTitle: "ILLIT – Flea Market",
      items: [],
    });
  }
});

app.get("/albums/new", requireLogin, (req, res) => {
  res.render("album_new", { siteTitle: "상품 등록" });
});

app.post("/albums/new", requireLogin, async (req, res) => {
  try {
    const { title, price, location, image, description } = req.body;

    await Item.create({
      authorId: req.session.user.id,
      authorNickname: req.session.user.nickname,
      title,
      price: price ? Number(price) : null,
      location,
      image,
      description,
    });

    res.redirect("/albums");
  } catch (err) {
    console.error("Item create error:", err);
    res.redirect("/albums/new");
  }
});

app.get("/albums/:id", requireLogin, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.redirect("/albums");

    res.render("album_detail", {
      siteTitle: "상품 상세",
      item,
      user: req.session.user,
    });

  } catch (e) {
    console.error(e);
    res.redirect("/albums");
  }
});

app.get("/albums/edit/:id", requireLogin, async (req, res) => {
  const item = await Item.findById(req.params.id).lean();
  if (!item) return res.redirect("/albums");

  if (String(item.authorId) !== String(req.session.user.id))
    return res.redirect(`/albums/${item._id}`);

  res.render("album_edit", {
    siteTitle: "상품 수정",
    item,
  });
});

app.post("/albums/edit/:id", requireLogin, async (req, res) => {
  const { title, price, location, image, description } = req.body;

  const item = await Item.findById(req.params.id);
  if (!item) return res.redirect("/albums");

  if (String(item.authorId) !== String(req.session.user.id))
    return res.redirect(`/albums/${item._id}`);

  item.title = title;
  item.price = price ? Number(price) : null;
  item.location = location;
  item.image = image;
  item.description = description;

  await item.save();

  res.redirect(`/albums/${item._id}`);
});

app.post("/albums/:id/delete", requireLogin, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.redirect("/albums");

    if (String(item.authorId) !== String(req.session.user.id))
      return res.redirect(`/albums/${item._id}`);

    await Item.deleteOne({ _id: item._id });

    res.redirect("/albums");
  } catch (err) {
    console.error(err);
    res.redirect("/albums");
  }
});


// =======================================================
//                     MEMBERS + GALLERY
// =======================================================
app.get("/members", requireLogin, (req, res) => {
  res.render("members", { siteTitle: "ILLIT – Members" });
});

// 🎉 갤러리 라우터
const galleryRoute = require("./routes/gallery");
app.use("/gallery", requireLogin, galleryRoute);


// =======================================================
//                     NEWS (CALENDAR)
// =======================================================
const scheduleRouter = require("./routes/schedule");
app.use("/api/schedule", scheduleRouter);


// =======================================================
//                     BASIC PAGES
// =======================================================
app.get("/profile", requireLogin, (req, res) => {
  res.render("profile", { siteTitle: "ILLIT – Profile" });
});

app.get("/news", requireLogin, (req, res) => {
  res.render("news", { siteTitle: "ILLIT – News" });
});


// =======================================================
//                     MYPAGE ROUTES
// =======================================================
const mypageRoutes = require("./routes/mypage");
app.use("/mypage", mypageRoutes);


// =======================================================
//                     START SERVER
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
