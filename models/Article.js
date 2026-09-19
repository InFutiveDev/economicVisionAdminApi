const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    paragraph: {
      type: String,
      required: [true, "Paragraph is required"],
      trim: true,
    },
    subHeading: {
      type: String,
      required: [true, "Sub heading is required"],
      trim: true,
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    authorImage: {
      type: String,
      required: [true, "Author image is required"],
      trim: true,
    },
    articleImage: {
      type: String,
      required: [true, "Article image is required"],
      trim: true,
    },
    articleCategory: {
      type: String,
      required: [true, "Article category is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
