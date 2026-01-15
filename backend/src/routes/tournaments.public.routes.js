const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");

// lista opublikowanych
router.get("/", async (req, res) => {
  const items = await Tournament.find({ status: "published" }).sort({ startDate: 1 });
  res.json(items);
});

// po slugu
router.get("/:slug", async (req, res) => {
  const item = await Tournament.findOne({ slug: req.params.slug, status: "published" });
  if (!item) return res.status(404).json({ message: "Nie znaleziono turnieju" });
  res.json(item);
});

module.exports = router;
