const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

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

// USER TEAM (create + my team)
app.use("/api/team", require("./routes/team.create.routes")); // POST /api/team, PATCH /api/team/me
app.use("/api/team", require("./routes/team.me.routes"));     // GET /api/team/me

module.exports = app;
