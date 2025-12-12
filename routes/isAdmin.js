// routes/isAdmin.js
module.exports = function (req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  if (!req.session.user.isAdmin) {
    return res.status(403).send("관리자만 접근 가능합니다.");
  }

  next();
};
