const mongoose = require("mongoose");

const MEDIA_TYPES = ["video", "podcast", "story"];

const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: MEDIA_TYPES },
    title: { type: String, required: [true, "Title is required"], trim: true },
    summary: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    duration: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mediaSchema.index({ type: 1, order: 1 });

module.exports = mongoose.model("Media", mediaSchema);
module.exports.MEDIA_TYPES = MEDIA_TYPES;
