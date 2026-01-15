const admin = require("firebase-admin");

let firebaseReady = false;

try {
  const projectId = process.env.FB_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL;
  const privateKey = process.env.FB_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.log("⚠️ Firebase Admin: brak zmiennych w .env (FB_PROJECT_ID / FB_CLIENT_EMAIL / FB_PRIVATE_KEY)");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    firebaseReady = true;
    console.log("✅ Firebase Admin gotowy");
  }
} catch (err) {
  console.log("⚠️ Firebase Admin nie wystartował:", err.message);
}

module.exports = { admin, firebaseReady };
