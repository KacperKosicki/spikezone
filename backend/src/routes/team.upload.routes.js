const express = require("express");
const router = express.Router();
const multer = require("multer");

const auth = require("../middleware/auth");
const Team = require("../models/Team");
const { cloudinary, cloudinaryReady } = require("../config/cloudinary");

// multer w pamięci (buffer) -> upload stream do Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function uploadToCloudinary({ buffer, folder, publicId, transformation }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        transformation,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

// ✅ tylko sprawdzamy czy team istnieje (pending NIE BLOKUJE uploadu)
async function assertTeam(uid) {
  const team = await Team.findOne({ ownerUid: uid });
  if (!team) {
    const e = new Error("Nie masz drużyny");
    e.status = 404;
    throw e;
  }
  return team;
}

/* =========================
   UPLOAD LOGO
   POST /api/team/upload/logo  (field: logo)
========================= */
router.post("/logo", auth, upload.single("logo"), async (req, res) => {
  try {
    if (!cloudinaryReady) return res.status(500).json({ message: "Cloudinary nie skonfigurowany" });

    const uid = req.user.uid;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Brak pliku" });
    if (!ALLOWED.includes(file.mimetype)) return res.status(400).json({ message: "Dozwolone: JPG/PNG/WEBP" });

    const team = await assertTeam(uid);

    const folder = `spikezone/teams/${uid}`;
    const publicId = "logo";

    const result = await uploadToCloudinary({
      buffer: file.buffer,
      folder,
      publicId,
      transformation: [
        { width: 512, height: 512, crop: "fill", gravity: "auto" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    team.logoUrl = result.secure_url;

    // po zmianie wraca do moderacji
    team.status = "pending";
    team.adminNote = "";

    await team.save();

    res.json({ ok: true, logoUrl: team.logoUrl });
  } catch (e) {
    const status = e.status || 500;
    console.error("TEAM UPLOAD logo:", e?.message || e);
    res.status(status).json({ message: e?.message || "Błąd serwera" });
  }
});

/* =========================
   UPLOAD BANNER
   POST /api/team/upload/banner (field: banner)
========================= */
router.post("/banner", auth, upload.single("banner"), async (req, res) => {
  try {
    if (!cloudinaryReady) return res.status(500).json({ message: "Cloudinary nie skonfigurowany" });

    const uid = req.user.uid;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Brak pliku" });
    if (!ALLOWED.includes(file.mimetype)) return res.status(400).json({ message: "Dozwolone: JPG/PNG/WEBP" });

    const team = await assertTeam(uid);

    const folder = `spikezone/teams/${uid}`;
    const publicId = "banner";

    const result = await uploadToCloudinary({
      buffer: file.buffer,
      folder,
      publicId,
      transformation: [
        { width: 1600, height: 500, crop: "fill", gravity: "auto" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    team.bannerUrl = result.secure_url;

    team.status = "pending";
    team.adminNote = "";

    await team.save();

    res.json({ ok: true, bannerUrl: team.bannerUrl });
  } catch (e) {
    const status = e.status || 500;
    console.error("TEAM UPLOAD banner:", e?.message || e);
    res.status(status).json({ message: e?.message || "Błąd serwera" });
  }
});

module.exports = router;
