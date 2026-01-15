const User = require("../models/User");

module.exports = async function requireAdmin(req, res, next) {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ message: "Brak autoryzacji" });

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(401).json({ message: "Użytkownik nie istnieje" });

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Brak uprawnień (admin)" });
    }

    req.dbUser = user; // jak chcesz w kontrolerach
    next();
  } catch (e) {
    return res.status(500).json({ message: "Błąd serwera" });
  }
};
