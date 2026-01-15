const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const Team = require("../models/Team");
const toSlug = require("../utils/toSlug");

// ✅ LIST
router.get("/", auth, requireAdmin, async (req, res) => {
  const items = await Team.find().sort({ createdAt: -1 });
  res.json(items);
});

// ✅ UPDATE STATUS (+ adminNote)
router.patch("/:id/status", auth, requireAdmin, async (req, res) => {
  const { status, adminNote = "" } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Niepoprawny status" });
  }

  const updated = await Team.findByIdAndUpdate(
    req.params.id,
    { $set: { status, adminNote: String(adminNote || "").trim() } },
    { new: true, runValidators: true }
  );

  if (!updated) return res.status(404).json({ message: "Nie znaleziono drużyny" });
  res.json(updated);
});

// (opcjonalnie) admin edit: nazwa/opis/zdjęcia + przeliczenie slug przy zmianie nazwy
router.patch("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.name) {
      payload.name = String(payload.name).trim();
      payload.slug = toSlug(payload.name);
    }

    // jeżeli admin poda slug ręcznie
    if (payload.slug && !payload.name) {
      payload.slug = toSlug(payload.slug);
    }

    // kolizja sluga z inną drużyną
    if (payload.slug) {
      const clash = await Team.findOne({
        slug: payload.slug,
        _id: { $ne: req.params.id },
      })
        .select("_id")
        .lean();

      if (clash) return res.status(409).json({ message: "Slug już istnieje" });
    }

    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Nie znaleziono drużyny" });
    res.json(updated);
  } catch (e) {
    if (String(e.message).includes("duplicate key")) {
      return res.status(409).json({ message: "Slug już istnieje" });
    }
    console.error("admin.teams PATCH:", e.message);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

module.exports = router;
