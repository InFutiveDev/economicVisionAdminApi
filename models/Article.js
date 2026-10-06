const mongoose = require("mongoose");

const BLOCK_TYPES = [
  "heading",
  "paragraph",
  "image",
  "quote",
  "list",
  "divider",
  "callout",
  "stats",
  "table",
  "gallery",
  "code",
  "button",
];

const blockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, enum: BLOCK_TYPES },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    kicker: { type: String, default: "", trim: true },
    excerpt: { type: String, default: "", trim: true },
    category: { type: String, default: "Economy", trim: true },
    subCategory: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    coverImage: { type: String, default: "", trim: true },
    featured: { type: Boolean, default: false },
    author: { type: String, default: "Editorial Desk", trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "review"],
      default: "draft",
    },
    publishedAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
    blocks: { type: [blockSchema], default: [] },
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });

module.exports = mongoose.model("Article", articleSchema);
