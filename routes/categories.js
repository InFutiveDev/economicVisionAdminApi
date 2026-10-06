const express = require("express");
const mongoose = require("mongoose");
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
    parentId: doc.parent ? String(doc.parent) : null,
    order: doc.order || 0,
    showInNav: doc.showInNav !== false,
  };
}

async function listCategories() {
  const categories = await Category.find().sort({ order: 1, name: 1 });
  return categories.map(serializeCategory);
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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Sub-categories are one level deep: a parent must itself be a main category.
async function resolveParent(rawParentId, selfId) {
  if (rawParentId === undefined) return { skip: true };
  if (!rawParentId) return { parent: null };
  if (!mongoose.isValidObjectId(rawParentId)) return { error: "Parent category is invalid." };
  if (selfId && String(rawParentId) === String(selfId)) {
    return { error: "A category cannot be its own parent." };
  }
  const parent = await Category.findById(rawParentId);
  if (!parent) return { error: "Parent category not found." };
  if (parent.parent) return { error: "Choose a main category as the parent, not a sub-category." };
  if (selfId && (await Category.exists({ parent: selfId }))) {
    return { error: "This category has sub-categories, so it cannot become a sub-category." };
  }
  return { parent: parent._id };
}

router.get("/", async (req, res) => {
  try {
    res.json({ categories: await listCategories() });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required." });

    const resolved = await resolveParent(req.body.parentId || null);
    if (resolved.error) return res.status(400).json({ message: resolved.error });
    const parent = resolved.parent || null;

    if (await Category.exists({ name: new RegExp(`^${escapeRegex(name)}$`, "i"), parent })) {
      return res.status(409).json({ message: "A category with this name already exists here." });
    }

    const last = await Category.findOne({ parent }).sort({ order: -1 });
    const category = await Category.create({
      name,
      slug: await uniqueCategorySlug(req.body.slug || name),
      description: String(req.body.description || "").trim(),
      parent,
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
    res.json({ categories: await listCategories() });
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

    const resolved = await resolveParent(req.body.parentId, category._id);
    if (resolved.error) return res.status(400).json({ message: resolved.error });
    if (!resolved.skip) {
      const parent = resolved.parent || null;
      if (String(parent) !== String(category.parent || null)) {
        const last = await Category.findOne({ parent }).sort({ order: -1 });
        category.parent = parent;
        category.order = last ? last.order + 1 : 1;
      }
    }

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
    const childCount = await Category.countDocuments({ parent: req.params.id });
    if (childCount) {
      return res.status(409).json({
        message: `Delete or move its ${childCount} sub-categor${childCount === 1 ? "y" : "ies"} first.`,
      });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });
    res.json({ deleted: true });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete category", error: error.message });
  }
});

module.exports = router;
