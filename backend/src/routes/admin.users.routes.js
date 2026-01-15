const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const User = require("../models/User");

// LIST users
router.get("/", auth, requireAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// set role
router.patch("/:id/role", auth, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Niepoprawna rola" });
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role } },
    { new: true, runValidators: true }
  );

  if (!updated) return res.status(404).json({ message: "Nie znaleziono usera" });
  res.json(updated);
});

module.exports = router;
