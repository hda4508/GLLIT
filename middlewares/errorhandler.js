// middlewares/errorhandler.js
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    status,
    message: err.message || '서버 오류 발생',
  });
};
