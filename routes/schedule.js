const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// JSON 파일 경로
const schedulePath = path.join(__dirname, "../data/schedule.json");

// 일정 가져오기
router.get("/", (req, res) => {
  const data = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
  res.json(data);
});

// 일정 추가
router.post("/add", (req, res) => {
  const { date, title, type } = req.body;
  const list = JSON.parse(fs.readFileSync(schedulePath, "utf8"));

  list.push({ date, title, type });
  fs.writeFileSync(schedulePath, JSON.stringify(list, null, 2));

  res.json({ ok: true });
});

// 일정 삭제
router.post("/delete", (req, res) => {
  const { date, title } = req.body;
  let list = JSON.parse(fs.readFileSync(schedulePath, "utf8"));

  list = list.filter(item => !(item.date === date && item.title === title));
  fs.writeFileSync(schedulePath, JSON.stringify(list, null, 2));

  res.json({ ok: true });
});

// 일정 수정
router.post("/edit", (req, res) => {
  const { oldDate, oldTitle, newDate, newTitle, newType } = req.body;
  const list = JSON.parse(fs.readFileSync(schedulePath, "utf8"));

  const item = list.find(i => i.date === oldDate && i.title === oldTitle);
  if (item) {
    item.date = newDate;
    item.title = newTitle;
    item.type = newType;
  }

  fs.writeFileSync(schedulePath, JSON.stringify(list, null, 2));
  res.json({ ok: true });
});

module.exports = router;
