const Article = require("../models/Article");
const { serializeArticle, serializePage } = require("../utils/serializers");
const { uniqueSlug } = require("../utils/slug");

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

function validatePayload(payload) {
  if (!payload.title) return "Title is required.";
  if (payload.blocks.length === 0) return "Add at least one block before saving.";
  return "";
}

async function listArticles(req, res) {
  try {
    const articles = await Article.find().sort({ updatedAt: -1 });
    res.json({ articles: articles.map(serializeArticle) });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
}

async function getArticle(req, res) {
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
}

async function createArticle(req, res) {
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
}

async function updateArticle(req, res) {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    const payload = readPayload(req.body);
    const message = validatePayload(payload);
    if (message) {
      return res.status(400).json({ message });
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
}

async function publishArticle(req, res) {
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
}

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  publishArticle,
};
