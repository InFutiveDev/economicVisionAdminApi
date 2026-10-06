const express = require("express");
const Media = require("../models/Media");
const { MEDIA_TYPES } = require("../models/Media");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

function serializeMedia(doc) {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    summary: doc.summary || "",
    image: doc.image || "",
    url: doc.url || "",
    duration: doc.duration || "",
    category: doc.category || "",
    subCategory: doc.subCategory || "",
    order: doc.order || 0,
    published: doc.published !== false,
  };
}

function readMedia(body) {
  return {
    title: String(body.title || "").trim(),
    summary: String(body.summary || "").trim(),
    image: String(body.image || "").trim(),
    url: String(body.url || "").trim(),
    duration: String(body.duration || "").trim(),
    category: String(body.category || "").trim(),
    subCategory: body.category ? String(body.subCategory || "").trim() : "",
    published: body.published !== false,
  };
}

router.get("/", async (req, res) => {
  try {
    const filter = MEDIA_TYPES.includes(req.query.type) ? { type: req.query.type } : {};
    const items = await Media.find(filter).sort({ type: 1, order: 1, createdAt: -1 });
    res.json({ items: items.map(serializeMedia) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch media", error: error.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const type = req.body.type;
    if (!MEDIA_TYPES.includes(type)) {
      return res.status(400).json({ message: "Type must be video, podcast, or story." });
    }
    const payload = readMedia(req.body);
    if (!payload.title) return res.status(400).json({ message: "Title is required." });

    const last = await Media.findOne({ type }).sort({ order: -1 });
    const item = await Media.create({ ...payload, type, order: last ? last.order + 1 : 1 });
    res.status(201).json({ item: serializeMedia(item) });
  } catch (error) {
    res.status(400).json({ message: "Failed to create media", error: error.message });
  }
});

router.put("/reorder", requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await Promise.all(ids.map((id, index) => Media.updateOne({ _id: id }, { order: index + 1 })));
    res.json({ reordered: true });
  } catch (error) {
    res.status(400).json({ message: "Failed to reorder media", error: error.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const item = await Media.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Media item not found." });

    const payload = readMedia({ ...serializeMedia(item), ...req.body });
    if (!payload.title) return res.status(400).json({ message: "Title is required." });

    Object.assign(item, payload);
    await item.save();
    res.json({ item: serializeMedia(item) });
  } catch (error) {
    res.status(400).json({ message: "Failed to update media", error: error.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const item = await Media.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Media item not found." });
    res.json({ deleted: true });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete media", error: error.message });
  }
});

module.exports = router;
