const express = require("express");
const Category = require("../models/Category");
const { requireAdmin } = require("../middleware/auth");
const { slugify } = require("../utils/slug");

const router = express.Router();

function serializeCategory(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || "",
    order: doc.order || 0,
    showInNav: doc.showInNav !== false,
  };
}

async function uniqueCategorySlug(value, excludeId) {
  const base = slugify(value);
  let slug = base;
  let index = 1;
  while (await Category.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug })) {
    index += 1;
    slug = `${base}-${index}`;
  }
  return slug;
}

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    res.json({ categories: categories.map(serializeCategory) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required." });
    if (await Category.exists({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })) {
      return res.status(409).json({ message: "A category with this name already exists." });
    }

    const last = await Category.findOne().sort({ order: -1 });
    const category = await Category.create({
      name,
      slug: await uniqueCategorySlug(req.body.slug || name),
      description: String(req.body.description || "").trim(),
      showInNav: req.body.showInNav !== false,
      order: last ? last.order + 1 : 1,
    });
    res.status(201).json({ category: serializeCategory(category) });
  } catch (error) {
    res.status(400).json({ message: "Failed to create category", error: error.message });
  }
});

router.put("/reorder", requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await Promise.all(
      ids.map((id, index) => Category.updateOne({ _id: id }, { order: index + 1 }))
    );
    const categories = await Category.find().sort({ order: 1, name: 1 });
    res.json({ categories: categories.map(serializeCategory) });
  } catch (error) {
    res.status(400).json({ message: "Failed to reorder categories", error: error.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });

    const name = String(req.body.name ?? category.name).trim();
    if (!name) return res.status(400).json({ message: "Category name is required." });

    const renamed = name !== category.name;
    category.name = name;
    if (req.body.slug !== undefined || renamed) {
      category.slug = await uniqueCategorySlug(req.body.slug || name, category._id);
    }
    if (req.body.description !== undefined) {
      category.description = String(req.body.description).trim();
    }
    if (req.body.showInNav !== undefined) category.showInNav = Boolean(req.body.showInNav);
    await category.save();

    res.json({ category: serializeCategory(category) });
  } catch (error) {
    res.status(400).json({ message: "Failed to update category", error: error.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });
    res.json({ deleted: true });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete category", error: error.message });
  }
});

module.exports = router;
