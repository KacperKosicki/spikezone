const mongoose = require("mongoose");
const toSlug = require("../utils/toSlug");

/* =========================
   MEMBER
========================= */

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 60,
    },
  },
  { _id: false }
);

/* =========================
   TEAM
========================= */

const teamSchema = new mongoose.Schema(
  {
    ownerUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },

    nameLower: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    logoUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    members: {
      type: [memberSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Maksymalnie 10 członków",
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

/* =========================
   HOOK – AUTO NORMALIZE
========================= */

teamSchema.pre("validate", function () {
  if (this.name) {
    const clean = String(this.name).trim();
    this.name = clean;
    this.nameLower = clean.toLowerCase();
    if (!this.slug) this.slug = toSlug(clean);
  }
});

module.exports = mongoose.model("Team", teamSchema);
