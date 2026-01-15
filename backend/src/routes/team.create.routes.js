const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.js");
const Team = require("../models/Team");
const toSlug = require("../utils/toSlug");

/* =========================
   CREATE TEAM
========================= */
router.post("/", auth, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, description = "", members = [], logoUrl = "", bannerUrl = "" } = req.body;

        const nameTrim = String(name || "").trim();
        if (!nameTrim) return res.status(400).json({ message: "Podaj nazwę drużyny" });
        if (nameTrim.length < 2) return res.status(400).json({ message: "Nazwa min. 2 znaki" });
        if (nameTrim.length > 40) return res.status(400).json({ message: "Nazwa max 40 znaków" });

        const exists = await Team.findOne({ ownerUid: uid });
        if (exists) return res.status(409).json({ message: "Masz już drużynę" });

        const taken = await Team.findOne({ nameLower: nameTrim.toLowerCase() });
        if (taken) return res.status(409).json({ message: "Nazwa drużyny jest już zajęta" });

        const normalized = (Array.isArray(members) ? members : [])
            .map((m) => String(m?.fullName || "").trim())
            .filter((v) => v.length > 0);

        if (normalized.length === 0) return res.status(400).json({ message: "Dodaj przynajmniej jednego zawodnika" });
        if (normalized.length > 10) return res.status(400).json({ message: "Maks. 10 zawodników" });

        const invalidIdx = normalized.findIndex((v) => v.length < 3);
        if (invalidIdx !== -1)
            return res.status(400).json({ message: `Zawodnik #${invalidIdx + 1} min. 3 znaki` });

        const lower = normalized.map((v) => v.toLowerCase());
        if (lower.some((v, i) => lower.indexOf(v) !== i))
            return res.status(400).json({ message: "Duplikaty w składzie" });

        const team = await Team.create({
            ownerUid: uid,
            name: nameTrim,
            nameLower: nameTrim.toLowerCase(),
            slug: toSlug(nameTrim),
            description: description.trim(),
            logoUrl: logoUrl.trim(),
            bannerUrl: bannerUrl.trim(),
            members: normalized.map((fullName) => ({ fullName })),
            status: "pending",
        });

        res.status(201).json(team);
    } catch (e) {
        if (e?.name === "ValidationError") {
            const key = Object.keys(e.errors || {})[0];
            return res.status(400).json({ message: e.errors[key]?.message || "Niepoprawne dane" });
        }

        if (String(e.message).includes("duplicate key")) {
            return res.status(409).json({ message: "Nazwa drużyny jest już zajęta" });
        }

        console.error("TEAM.CREATE:", e);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

/* =========================
   UPDATE TEAM
========================= */
router.patch("/me", auth, async (req, res) => {
    try {
        const uid = req.user.uid;
        const team = await Team.findOne({ ownerUid: uid });
        if (!team) return res.status(404).json({ message: "Nie masz drużyny" });

        const { description, members, logoUrl, bannerUrl } = req.body;

        const isPending = team.status === "pending";

        // ✅ W PENDING ZEZWALAMY TYLKO NA LOGO/BANNER
        if (isPending) {
            if (typeof logoUrl === "string") team.logoUrl = logoUrl.trim();
            if (typeof bannerUrl === "string") team.bannerUrl = bannerUrl.trim();

            // jeśli ktoś próbuje zmienić opis/skład -> blokujemy
            if (typeof description === "string" || members !== undefined) {
                return res.status(403).json({
                    message: "Drużyna jest w trakcie rozpatrywania – możesz zmienić tylko logo i banner",
                });
            }

            team.adminNote = "";
            await team.save();
            return res.json(team);
        }

        // ✅ GDY NIE PENDING -> normalna edycja wszystkiego
        if (typeof description === "string") team.description = description.trim();
        if (typeof logoUrl === "string") team.logoUrl = logoUrl.trim();
        if (typeof bannerUrl === "string") team.bannerUrl = bannerUrl.trim();

        if (members !== undefined) {
            const normalized = members.map((m) => String(m?.fullName || "").trim()).filter(Boolean);

            if (normalized.length === 0) return res.status(400).json({ message: "Dodaj zawodnika" });
            if (normalized.length > 10) return res.status(400).json({ message: "Maks. 10 zawodników" });

            const invalidIdx = normalized.findIndex((v) => v.length < 3);
            if (invalidIdx !== -1) return res.status(400).json({ message: `Zawodnik #${invalidIdx + 1} min. 3 znaki` });

            team.members = normalized.map((fullName) => ({ fullName }));
        }

        // po edycji danych wraca do moderacji
        team.status = "pending";
        team.adminNote = "";

        await team.save();
        res.json(team);
    } catch (e) {
        console.error("TEAM.PATCH:", e);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

module.exports = router;
