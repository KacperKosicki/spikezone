const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const Tournament = require("../models/Tournament");
const TournamentRegistration = require("../models/TournamentRegistration"); // ✅ DODAJ
const toSlug = require("../utils/toSlug");

// helper: unikalny slug bez while (1-2 zapytania)
async function makeUniqueTournamentSlug(baseSlug) {
  const clean = baseSlug || "turniej";
  const exists = await Tournament.findOne({ slug: clean }).select("_id").lean();
  if (!exists) return clean;

  const suffix = Date.now().toString().slice(-6);
  return `${clean}-${suffix}`;
}

// ✅ LIST
router.get("/", auth, requireAdmin, async (req, res) => {
  const items = await Tournament.find().sort({ startDate: -1, createdAt: -1 });
  res.json(items);
});

// ✅ GET ONE
router.get("/:id", auth, requireAdmin, async (req, res) => {
  const item = await Tournament.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Nie znaleziono turnieju" });
  res.json(item);
});

// ✅ CREATE
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      status,
      city,
      venue,

      regStartAt,
      regEndAt,
      eventStartAt,

      description,
      teamLimit,
      entryFee,
    } = req.body;

    if (!title?.trim() || !regStartAt || !regEndAt || !eventStartAt) {
      return res.status(400).json({
        message: "Brak wymaganych pól: title/regStartAt/regEndAt/eventStartAt",
      });
    }

    // walidacje czasu
    const rs = new Date(regStartAt);
    const re = new Date(regEndAt);
    const es = new Date(eventStartAt);

    if (Number.isNaN(rs.getTime()) || Number.isNaN(re.getTime()) || Number.isNaN(es.getTime())) {
      return res.status(400).json({ message: "Niepoprawny format daty/czasu" });
    }

    if (re <= rs) return res.status(400).json({ message: "regEndAt musi być po regStartAt" });
    if (es <= re) return res.status(400).json({ message: "eventStartAt musi być po zakończeniu zapisów" });

    const baseSlug = toSlug((slug && String(slug)) || title);
    const finalSlug = await makeUniqueTournamentSlug(baseSlug);

    const created = await Tournament.create({
      title: title.trim(),
      slug: finalSlug,
      status: ["draft", "published", "archived"].includes(status) ? status : "draft",
      city: String(city || "").trim(),
      venue: String(venue || "").trim(),

      regStartAt: rs,
      regEndAt: re,
      eventStartAt: es,

      description: String(description || "").trim(),
      teamLimit: Number(teamLimit ?? 16),
      entryFee: Number(entryFee ?? 0),

      createdByUid: req.user.uid,
      updatedByUid: req.user.uid,
    });

    res.status(201).json(created);
  } catch (e) {
    if (String(e.message).includes("duplicate key")) {
      return res.status(409).json({ message: "Slug już istnieje" });
    }
    console.error("admin.tournaments CREATE:", e.message);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// ✅ UPDATE
router.patch("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const existing = await Tournament.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Nie znaleziono turnieju" });

    const payload = { ...req.body, updatedByUid: req.user.uid };

    if (payload.slug) payload.slug = toSlug(payload.slug);
    if (!payload.slug && payload.title) payload.slug = toSlug(payload.title);

    if (payload.status && !["draft", "published", "archived"].includes(payload.status)) {
      return res.status(400).json({ message: "Niepoprawny status" });
    }

    if (payload.slug) {
      const clash = await Tournament.findOne({
        slug: payload.slug,
        _id: { $ne: req.params.id },
      }).select("_id").lean();
      if (clash) return res.status(409).json({ message: "Slug już istnieje" });
    }

    // ✅ daty: weź finalne wartości (z payload albo z existing)
    const rs = payload.regStartAt ? new Date(payload.regStartAt) : new Date(existing.regStartAt);
    const re = payload.regEndAt ? new Date(payload.regEndAt) : new Date(existing.regEndAt);
    const es = payload.eventStartAt ? new Date(payload.eventStartAt) : new Date(existing.eventStartAt);

    if ([rs, re, es].some((d) => Number.isNaN(d.getTime()))) {
      return res.status(400).json({ message: "Niepoprawny format daty/czasu" });
    }
    if (re <= rs) return res.status(400).json({ message: "regEndAt musi być po regStartAt" });
    if (es <= re) return res.status(400).json({ message: "eventStartAt musi być po zakończeniu zapisów" });

    // przypisz znormalizowane daty
    payload.regStartAt = rs;
    payload.regEndAt = re;
    payload.eventStartAt = es;

    const updated = await Tournament.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (e) {
    if (String(e.message).includes("duplicate key")) {
      return res.status(409).json({ message: "Slug już istnieje" });
    }
    console.error("admin.tournaments UPDATE:", e.message);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// ✅ DELETE + CASCADE
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Tournament.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Nie znaleziono turnieju" });

    // ✅ usuń WSZYSTKIE zgłoszenia dla tego turnieju
    await TournamentRegistration.deleteMany({ tournamentId: deleted._id });

    return res.json({ ok: true });
  } catch (e) {
    console.error("admin.tournaments DELETE:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

module.exports = router;
