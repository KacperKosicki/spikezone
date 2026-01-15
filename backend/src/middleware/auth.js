const { admin, firebaseReady } = require("../config/firebaseAdmin");

module.exports = async function auth(req, res, next) {
  try {
    if (!firebaseReady) {
      return res.status(500).json({ message: "Firebase Admin nie jest skonfigurowany (sprawdź .env)" });
    }

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Brak tokena" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // ✅ uid, email, name itd.
    next();
  } catch (err) {
    return res.status(401).json({ message: "Nieprawidłowy token" });
  }
};
