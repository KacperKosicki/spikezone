const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const TournamentRegistration = require("../models/TournamentRegistration");

/* =========================
   POST /api/tournaments/:slug/register (AUTH)
========================= */
router.post("/:slug/register", auth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const slug = String(req.params.slug || "").trim().toLowerCase();

    const tournament = await Tournament.findOne({ slug, status: "published" }).lean();
    if (!tournament) {
      return res.status(404).json({
        code: "TOURNAMENT_NOT_FOUND",
        message: "Nie znaleziono turnieju",
      });
    }

    // ✅ BLOKADA OKNA ZAPISÓW (regStartAt / regEndAt)
    const now = new Date();

    if (tournament.regStartAt) {
      const rs = new Date(tournament.regStartAt);
      if (!Number.isNaN(rs.getTime()) && now < rs) {
        return res.status(409).json({
          code: "REGISTRATION_NOT_STARTED",
          message: "Zapisy jeszcze się nie rozpoczęły.",
        });
      }
    }

    if (tournament.regEndAt) {
      const re = new Date(tournament.regEndAt);
      if (!Number.isNaN(re.getTime()) && now > re) {
        return res.status(409).json({
          code: "REGISTRATION_CLOSED",
          message: "Zapisy zostały zakończone — nie można już dołączyć.",
        });
      }
    }

    const team = await Team.findOne({ ownerUid: uid }).lean();
    if (!team) {
      return res.status(404).json({
        code: "NEED_TEAM",
        message: "Aby zgłosić się do turnieju, musisz najpierw utworzyć drużynę.",
      });
    }

    if (team.status !== "approved") {
      return res.status(403).json({
        code: "TEAM_NOT_APPROVED",
        message: "Twoja drużyna nie jest jeszcze zaakceptowana.",
      });
    }

    // ✅ 1 ownerUid = 1 zgłoszenie na turniej
    const existing = await TournamentRegistration.findOne({
      tournamentId: tournament._id,
      ownerUid: uid,
    }).lean();

    if (existing) {
      await TournamentRegistration.updateOne(
        { _id: existing._id },
        {
          $set: {
            tournamentSlug: tournament.slug,
            teamId: team._id,
            teamName: team.name,
            teamSlug: team.slug,
            teamLogoUrl: team.logoUrl || "",
            teamBannerUrl: team.bannerUrl || "",
          },
        }
      );

      return res.status(200).json({
        ok: true,
        message: "✅ Zaktualizowano zgłoszenie drużyny do turnieju.",
      });
    }

    const limit = Number.isFinite(tournament.teamLimit) ? tournament.teamLimit : 16;
    const count = await TournamentRegistration.countDocuments({ tournamentId: tournament._id });

    if (count >= limit) {
      return res.status(409).json({
        code: "TOURNAMENT_FULL",
        message: "Limit drużyn został osiągnięty.",
      });
    }

    const reg = await TournamentRegistration.create({
      tournamentId: tournament._id,
      tournamentSlug: tournament.slug,
      teamId: team._id,
      ownerUid: uid,
      teamName: team.name,
      teamSlug: team.slug,
      teamLogoUrl: team.logoUrl || "",
      teamBannerUrl: team.bannerUrl || "",
    });

    return res.status(201).json({
      ok: true,
      message: "✅ Zgłoszenie wysłane! Twoja drużyna bierze udział w turnieju.",
      registered: {
        id: reg._id,
        teamName: reg.teamName,
        teamSlug: reg.teamSlug,
        teamLogoUrl: reg.teamLogoUrl,
      },
    });
  } catch (e) {
    if (String(e?.message || "").includes("duplicate key")) {
      return res.status(409).json({
        code: "ALREADY_REGISTERED",
        message: "Masz już zgłoszenie drużyny do tego turnieju.",
      });
    }
    console.error("TOURNAMENT.REGISTER:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/* =========================
   GET /api/tournaments/:slug/registrations (PUBLIC)
========================= */
router.get("/:slug/registrations", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();

    const tournament = await Tournament.findOne({ slug, status: "published" })
      .select("_id teamLimit")
      .lean();

    if (!tournament) return res.status(404).json({ message: "Nie znaleziono turnieju" });

    const limit = Number.isFinite(tournament.teamLimit) ? tournament.teamLimit : 16;

    const itemsRaw = await TournamentRegistration.find({ tournamentId: tournament._id })
      .select("teamId teamName teamSlug teamLogoUrl teamBannerUrl createdAt")
      .sort({ createdAt: 1 })
      .lean();

    // ✅ CLEANUP / FILTER: nie pokazuj zgłoszeń, których team już nie istnieje
    const teamIds = itemsRaw.map((x) => x.teamId).filter(Boolean);

    const existingTeams = await Team.find({ _id: { $in: teamIds }, status: "approved" })
      .select("_id")
      .lean();

    const existingSet = new Set(existingTeams.map((t) => String(t._id)));
    const items = itemsRaw.filter((x) => existingSet.has(String(x.teamId)));

    return res.json({
      stats: { count: items.length, limit },
      items: items.map(({ teamId, ...rest }) => rest), // teamId niepotrzebne na public
    });
  } catch (e) {
    console.error("TOURNAMENT.registrations:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

module.exports = router;
