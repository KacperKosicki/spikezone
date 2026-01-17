const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },

    city: { type: String, default: "" },
    venue: { type: String, default: "" },

    // ✅ OKNO ZAPISÓW
    regStartAt: { type: Date, required: true },
    regEndAt: { type: Date, required: true },

    // ✅ TERMIN TURNIEJU (data + godzina)
    eventStartAt: { type: Date, required: true },
    // opcjonalnie:
    eventEndAt: { type: Date, default: null },

    description: { type: String, default: "" },

    teamLimit: { type: Number, default: 16 },
    entryFee: { type: Number, default: 0 },

    createdByUid: { type: String, required: true },
    updatedByUid: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
