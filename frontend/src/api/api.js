const express = require("express");
const cors = require("cors");

const app = express();

// ✅ dozwolone originy (prod + local)
const allowedOrigins = [
  process.env.FRONTEND_URL, // np. https://spikezone.vercel.app
  "http://localhost:3000",
].filter(Boolean);

// ✅ jedna konfiguracja CORS
const corsOptions = {
  origin: (origin, cb) => {
    // requesty bez Origin (np. health check / curl / Render) przepuszczamy
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ✅ preflight (NIE "*")
app.options("/*", cors(corsOptions));
// alternatywnie (też działa): app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "SPIKEZONE API działa" });
});

// AUTH
app.use("/api/auth", require("./routes/auth.routes"));

// ADMIN
app.use("/api/admin/tournaments", require("./routes/admin.tournaments.routes"));
app.use("/api/admin/users", require("./routes/admin.users.routes"));
app.use("/api/admin/teams", require("./routes/admin.teams.routes"));

// PUBLIC: tournaments
app.use("/api/tournaments", require("./routes/tournaments.public.routes"));

// PUBLIC: teams
app.use("/api/teams", require("./routes/teams.routes"));

// USER TEAM
app.use("/api/team", require("./routes/team.me.routes"));
app.use("/api/team", require("./routes/team.create.routes"));
app.use("/api/team/upload", require("./routes/team.upload.routes"));

app.use("/api/tournaments", require("./routes/tournaments.register.routes"));

app.use("/api/public", require("./routes/public"));

module.exports = app;
