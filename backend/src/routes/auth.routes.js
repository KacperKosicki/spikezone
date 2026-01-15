const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// ✅ tworzy usera w Mongo po zalogowaniu Firebase
router.post("/me", auth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email || "";
    const name = req.user.name || "";

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        displayName: name,
      });
    } else {
      // opcjonalnie aktualizacja danych
      const nextEmail = email || user.email;
      const nextName = name || user.displayName;

      if (user.email !== nextEmail || user.displayName !== nextName) {
        user.email = nextEmail;
        user.displayName = nextName;
        await user.save();
      }
    }

    res.json(user);
  } catch (err) {
    console.error("❌ /api/auth/me:", err.message);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

module.exports = router;
