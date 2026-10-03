const express = require("express");
const Article = require("../models/Article");
const { requireAdmin } = require("../middleware/auth");
const { serializePage } = require("../utils/serializers");
const { uniqueSlug } = require("../utils/slug");

const router = express.Router();
const STATUSES = ["draft", "published", "review"];

function readPayload(body) {
  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];

  return {
    title: String(body.title || "").trim(),
    slug: String(body.slug || "").trim(),
    kicker: String(body.kicker || "").trim(),
    excerpt: String(body.excerpt || "").trim(),
    category: String(body.category || "Economy").trim() || "Economy",
    tags,
    coverImage: String(body.coverImage || "").trim(),
    featured: Boolean(body.featured),
    author: String(body.author || "").trim() || "Editorial Desk",
    status: STATUSES.includes(body.status) ? body.status : "draft",
    blocks: Array.isArray(body.blocks) ? body.blocks : [],
  };
}

function validatePayload(payload) {
  if (!payload.title) return "Title is required.";
  if (payload.blocks.length === 0) return "Add at least one block before saving.";
  return "";
}

router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Page not found." });
    }

    res.json(serializePage(article));
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch page",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = readPayload(req.body);
    const message = validatePayload(payload);
    if (message) {
      return res.status(400).json({ message });
    }

    const article = await Article.create({
      ...payload,
      slug: await uniqueSlug(payload.slug || payload.title),
      publishedAt: payload.status === "published" ? new Date() : null,
    });

    res.status(201).json(serializePage(article));
  } catch (error) {
    res.status(400).json({
      message: "Failed to save page",
      error: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Page not found." });
    }

    const payload = readPayload(req.body);
    const message = validatePayload(payload);
    if (message) {
      return res.status(400).json({ message });
    }

    Object.assign(article, payload, {
      slug: await uniqueSlug(payload.slug || payload.title, article._id),
    });

    if (payload.status === "published" && !article.publishedAt) {
      article.publishedAt = new Date();
    }
    if (payload.status !== "published") {
      article.publishedAt = null;
    }

    await article.save();
    res.json(serializePage(article));
  } catch (error) {
    res.status(400).json({
      message: "Failed to update page",
      error: error.message,
    });
  }
});

router.post("/:id/publish", requireAdmin, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Page not found." });
    }

    article.status = "published";
    article.publishedAt = article.publishedAt || new Date();
    await article.save();

    res.json(serializePage(article));
  } catch (error) {
    res.status(400).json({
      message: "Failed to publish page",
      error: error.message,
    });
  }
});

module.exports = router;
