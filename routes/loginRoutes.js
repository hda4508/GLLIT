const express = require("express");
const router = express.Router();
const {
    // getRegister,
    // registerUser,
    getLogin,
    loginUser
} = require("../controllers/loginController");

router.route("/").get(getLogin).post(loginUser);
// router.route("/register").get(getRegister).post(registerUser);
// 관리자만 등록한 후 더 이상 사용자 등록을 하지 않을 것이기 때문에 지움
// 다시 관리자 등록할 때 사용

module.exports = router;