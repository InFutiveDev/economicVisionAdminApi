const Article = require("../models/Article");

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "article";
}

async function uniqueSlug(value, excludeId) {
  const base = slugify(value);
  let slug = base;
  let index = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await Article.exists(query);
    if (!exists) return slug;

    index += 1;
    slug = `${base}-${index}`;
  }
}

module.exports = { slugify, uniqueSlug };
