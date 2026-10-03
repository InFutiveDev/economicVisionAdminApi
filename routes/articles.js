const express = require("express");
const Article = require("../models/Article");
const { serializeArticle } = require("../utils/serializers");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const articles = await Article.find().sort({ updatedAt: -1 });
    res.json(articles.map(serializeArticle));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
});

module.exports = router;
