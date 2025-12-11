// models/contactModel.js
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, "전화번호는 꼭 기입해 주세요."],
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Contact", contactSchema);
