// makeAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.DB_CONNECT).then(async () => {
  console.log("DB Connected");

  const admin = await User.findOne({ username: "admin" });
  if (!admin) {
    console.log("❌ admin 계정이 없음");
    return process.exit();
  }

  admin.isAdmin = true;
  await admin.save();

  console.log("✅ admin 계정이 이제 관리자입니다!");
  process.exit();
});
