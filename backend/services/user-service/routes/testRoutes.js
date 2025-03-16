const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Tạo một schema và model đơn giản để test
const TestSchema = new mongoose.Schema({
  name: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Test = mongoose.model("Test", TestSchema);

// Tạo một bản ghi test
router.post("/", async (req, res) => {
  try {
    const test = new Test({
      name: req.body.name || "Test Item",
    });

    const savedTest = await test.save();
    res.status(201).json(savedTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy tất cả bản ghi test
router.get("/", async (req, res) => {
  try {
    const tests = await Test.find();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
