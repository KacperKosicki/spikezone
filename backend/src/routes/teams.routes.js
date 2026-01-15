const express = require("express");
const router = express.Router();

const Team = require("../models/Team");

/* =========================
   ✅ CHECK NAME (PUBLIC)
   GET /api/teams/check-name?name=...
   (UWAGA: musi być PRZED /:slug)
========================= */
router.get("/check-name", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();

    if (!name) return res.status(400).json({ message: "Podaj nazwę" });
    if (name.length < 2) return res.status(400).json({ message: "Nazwa min. 2 znaki" });
    if (name.length > 40) return res.status(400).json({ message: "Nazwa max 40 znaków" });

    const nameLower = name.toLowerCase();

    const taken = await Team.exists({ nameLower });
    return res.json({ available: !taken });
  } catch (e) {
    console.error("TEAMS.check-name:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/* =========================
   ✅ LIST APPROVED TEAMS (PUBLIC)
   GET /api/teams
========================= */
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find({ status: "approved" })
      .select("name slug description members logoUrl bannerUrl status")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(teams || []);
  } catch (e) {
    console.error("TEAMS.list:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/* =========================
   ✅ TEAM DETAILS BY SLUG (PUBLIC)
   GET /api/teams/:slug
========================= */
router.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) return res.status(400).json({ message: "Brak slug" });

    const team = await Team.findOne({ slug, status: "approved" })
      .select("name slug description members logoUrl bannerUrl status adminNote")
      .lean();

    if (!team) return res.status(404).json({ message: "Nie znaleziono drużyny" });
    return res.json(team);
  } catch (e) {
    console.error("TEAMS.slug:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

module.exports = router;
