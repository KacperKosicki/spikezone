const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },

    city: { type: String, default: "" },
    venue: { type: String, default: "" },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    description: { type: String, default: "" },

    // limity
    teamLimit: { type: Number, default: 16 },
    entryFee: { type: Number, default: 0 },

    // prosta lista drużyn (na MVP)
    teams: [
      {
        name: { type: String, required: true },
        captainName: { type: String, default: "" },
        captainPhone: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // audyt
    createdByUid: { type: String, required: true },
    updatedByUid: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
