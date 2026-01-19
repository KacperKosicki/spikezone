const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,      // np. https://spikezone.vercel.app
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // requesty bez Origin (np. Render health check) przepuszczamy
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// preflight dla wszystkich tras
app.options("*", cors());

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

// PUBLIC: teams (lista + szczegóły po slugu)
app.use("/api/teams", require("./routes/teams.routes"));

// USER TEAM
app.use("/api/team", require("./routes/team.me.routes"));     // GET/PATCH /api/team/me
app.use("/api/team", require("./routes/team.create.routes")); // POST /api/team

app.use("/api/team/upload", require("./routes/team.upload.routes"));

app.use("/api/tournaments", require("./routes/tournaments.register.routes"));

app.use("/api/public", require("./routes/public"));

module.exports = app;
