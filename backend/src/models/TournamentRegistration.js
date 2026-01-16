const mongoose = require("mongoose");

const tournamentRegistrationSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true, index: true },
    tournamentSlug: { type: String, required: true, index: true },

    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    ownerUid: { type: String, required: true, index: true },

    // snapshot pod publiczną listę (żeby nie robić joinów)
    teamName: { type: String, required: true },
    teamSlug: { type: String, required: true },
    teamLogoUrl: { type: String, default: "" },
    teamBannerUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// 1 drużyna = 1 zgłoszenie do danego turnieju
tournamentRegistrationSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

// ✅ NOWE: 1 właściciel = 1 zgłoszenie do turnieju
// (naprawia przypadek: usunął team, utworzył nowy → stary wpis nie powinien “żyć” jako osobne zgłoszenie)
tournamentRegistrationSchema.index({ tournamentId: 1, ownerUid: 1 }, { unique: true });

module.exports = mongoose.model("TournamentRegistration", tournamentRegistrationSchema);
