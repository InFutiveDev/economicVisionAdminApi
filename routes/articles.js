const express = require("express");
const Article = require("../models/Article");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const article = await Article.create({
      title: req.body.title,
      paragraph: req.body.paragraph,
      subHeading: req.body.subHeading,
      authorName: req.body.authorName,
      authorImage: req.body.authorImage,
      articleImage: req.body.articleImage,
      articleCategory: req.body.articleCategory,
    });

    res.status(201).json({
      message: "Article added successfully",
      article,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to add article",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json({ articles });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
});

module.exports = router;
