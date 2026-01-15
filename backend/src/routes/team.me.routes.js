const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.js"); // ✅ wymuszenie pliku
const Team = require("../models/Team");

router.get("/me", auth, async (req, res) => {
  const uid = req.user.uid;
  const team = await Team.findOne({ ownerUid: uid });
  res.json(team || null);
});

module.exports = router;
