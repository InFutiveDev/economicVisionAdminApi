const express = require("express");
const Article = require("../models/Article");
const { serializeArticle, serializePage } = require("../utils/serializers");
const { uniqueSlug } = require("../utils/slug");

const router = express.Router();
const STATUSES = ["draft", "published", "review"];

function readPayload(body) {
  const excerpt = String(body.excerpt || body.paragraph || "").trim();
  const title = String(body.title || "").trim();
  const blocks = Array.isArray(body.blocks) && body.blocks.length
    ? body.blocks
    : excerpt
      ? [{ id: crypto.randomUUID(), type: "paragraph", data: { text: excerpt } }]
      : [];

  return {
    title,
    slug: String(body.slug || "").trim(),
    kicker: String(body.kicker || body.subHeading || "").trim(),
    excerpt,
    category: String(body.category || body.articleCategory || "Economy").trim() || "Economy",
    tags: Array.isArray(body.tags)
      ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    coverImage: String(body.coverImage || body.articleImage || "").trim(),
    featured: Boolean(body.featured),
    author: String(body.author || body.authorName || "").trim() || "Editorial Desk",
    status: STATUSES.includes(body.status) ? body.status : "draft",
    blocks,
  };
}

router.get("/", async (req, res) => {
  try {
    const articles = await Article.find().sort({ updatedAt: -1 });
    res.json({ articles: articles.map(serializeArticle) });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    res.json({ article: serializePage(article) });
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch article",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = readPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Title is required." });
    }
    if (payload.blocks.length === 0) {
      return res.status(400).json({ message: "Add at least one block before saving." });
    }

    const article = await Article.create({
      ...payload,
      slug: await uniqueSlug(payload.slug || payload.title),
      publishedAt: payload.status === "published" ? new Date() : null,
    });

    res.status(201).json({
      message: "Article added successfully",
      article: serializePage(article),
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to add article",
      error: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    const payload = readPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Title is required." });
    }
    if (payload.blocks.length === 0) {
      return res.status(400).json({ message: "Add at least one block before saving." });
    }

    Object.assign(article, payload, {
      slug: await uniqueSlug(payload.slug || payload.title, article._id),
    });

    if (payload.status === "published") {
      article.publishedAt = article.publishedAt || new Date();
    } else {
      article.publishedAt = null;
    }

    await article.save();
    res.json({ article: serializePage(article) });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update article",
      error: error.message,
    });
  }
});

router.post("/:id/publish", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    article.status = "published";
    article.publishedAt = article.publishedAt || new Date();
    await article.save();

    res.json({ article: serializePage(article) });
  } catch (error) {
    res.status(400).json({
      message: "Failed to publish article",
      error: error.message,
    });
  }
});

module.exports = router;
