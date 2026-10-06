const mongoose = require("mongoose");

const HOME_SECTION_KEYS = [
  "hero",
  "top-stories",
  "latest-news",
  "exclusive",
  "why-it-matters",
  "opinion",
];

const itemSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true },
    label: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const homeSectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: HOME_SECTION_KEYS },
    items: { type: [itemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeSection", homeSectionSchema);
module.exports.HOME_SECTION_KEYS = HOME_SECTION_KEYS;
