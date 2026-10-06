const express = require("express");
const mongoose = require("mongoose");
const HomeSection = require("../models/HomeSection");
const { HOME_SECTION_KEYS } = require("../models/HomeSection");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
const MAX_ITEMS = 20;

function serializeItem(item) {
  const article = item.article;
  if (!article || !article._id) return null;
  return {
    articleId: String(article._id),
    title: article.title,
    category: article.category || "",
    author: article.author || "",
    status: article.status,
    coverImage: article.coverImage || "",
    label: item.label || "",
    note: item.note || "",
  };
}

async function loadSections() {
  const docs = await HomeSection.find().populate(
    "items.article",
    "title category author status coverImage"
  );
  const byKey = Object.fromEntries(docs.map((doc) => [doc.key, doc]));
  return Object.fromEntries(
    HOME_SECTION_KEYS.map((key) => [
      key,
      (byKey[key]?.items || []).map(serializeItem).filter(Boolean),
    ])
  );
}

router.get("/", async (req, res) => {
  try {
    res.json({ sections: await loadSections() });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch homepage", error: error.message });
  }
});

router.put("/:key", requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    if (!HOME_SECTION_KEYS.includes(key)) {
      return res.status(404).json({ message: "Unknown homepage section." });
    }

    const items = (Array.isArray(req.body.items) ? req.body.items : [])
      .filter((item) => mongoose.isValidObjectId(item?.articleId))
      .slice(0, MAX_ITEMS)
      .map((item) => ({
        article: item.articleId,
        label: String(item.label || "").trim(),
        note: String(item.note || "").trim(),
      }));

    const ids = items.map((item) => String(item.article));
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ message: "An article can only appear once per section." });
    }

    await HomeSection.findOneAndUpdate({ key }, { key, items }, { upsert: true });
    const sections = await loadSections();
    res.json({ key, items: sections[key] });
  } catch (error) {
    res.status(400).json({ message: "Failed to save homepage section", error: error.message });
  }
});

module.exports = router;
