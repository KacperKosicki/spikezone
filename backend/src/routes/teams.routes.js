const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth"); // ✅ DODANE
const Team = require("../models/Team");
const TournamentRegistration = require("../models/TournamentRegistration"); // ✅ DODANE

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
    if (name.length > 60) return res.status(400).json({ message: "Nazwa max 60 znaków" });

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
   ✅ DELETE MY TEAM (AUTH)
   DELETE /api/teams/me
   → usuwa drużynę + wszystkie jej zgłoszenia do turniejów
========================= */
router.delete("/me", auth, async (req, res) => {
  try {
    const uid = req.user.uid;

    const team = await Team.findOne({ ownerUid: uid });
    if (!team) return res.status(404).json({ message: "Brak drużyny" });

    // ✅ CASCADE DELETE – usuń zgłoszenia turniejowe tej drużyny
    await TournamentRegistration.deleteMany({ teamId: team._id });

    // ✅ usuń drużynę
    await Team.deleteOne({ _id: team._id });

    return res.json({
      ok: true,
      message: "✅ Drużyna usunięta wraz ze zgłoszeniami do turniejów.",
    });
  } catch (e) {
    console.error("TEAM.delete:", e);
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
