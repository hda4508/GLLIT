// myContacts/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },

  // ⭐ 관리자 여부
  isAdmin: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: true
});

//  비밀번호 해시 (저장 전)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 비밀번호 비교
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

//  유저 삭제 시 글 자동 삭제
userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter()).select("_id");
    if (doc) {
      const Post = require("./Post");
      await Post.deleteMany({ authorId: doc._id });
      console.log(`🧹 Deleted posts by user ${doc._id}`);
    }
    next();
  } catch (e) {
    console.error(" Cascade delete (findOneAndDelete) failed:", e);
    next(e);
  }
});

userSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter()).select("_id");
    if (doc) {
      const Post = require("./Post");
      await Post.deleteMany({ authorId: doc._id });
      console.log(`🧹 Deleted posts by user ${doc._id}`);
    }
    next();
  } catch (e) {
    console.error(" Cascade delete (deleteOne query) failed:", e);
    next(e);
  }
});

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const Post = require("./Post");
    await Post.deleteMany({ authorId: this._id });
    console.log(`🧹 Deleted posts by user ${this._id}`);
    next();
  } catch (e) {
    console.error(" Cascade delete (deleteOne doc) failed:", e);
    next(e);
  }
});

// ---------------------------------------
module.exports = mongoose.model("User", userSchema);
