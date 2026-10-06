const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "", trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    order: { type: Number, default: 0 },
    showInNav: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
