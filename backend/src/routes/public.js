const router = require("express").Router();
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");

router.get("/stats", async (req, res) => {
  try {
    const now = new Date();

    const [tournamentsTotal, tournamentsUpcoming, teamsTotal, teamsApproved] = await Promise.all([
      Tournament.countDocuments({ status: "published" }),
      Tournament.countDocuments({ status: "published", eventStartAt: { $gte: now } }),
      Team.countDocuments({}),
      Team.countDocuments({ status: "approved" }),
    ]);

    return res.json({
      tournamentsTotal,
      tournamentsUpcoming,
      teamsTotal,
      teamsApproved,
    });
  } catch (err) {
    console.error("public/stats error:", err);
    return res.status(500).json({ message: "Nie udało się pobrać statystyk" });
  }
});

module.exports = router;
