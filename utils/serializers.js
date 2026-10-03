function serializeUser(user) {
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function serializePage(doc) {
  const article = doc.toObject({ versionKey: false });
  return {
    id: String(article._id),
    title: article.title,
    slug: article.slug,
    kicker: article.kicker || "",
    excerpt: article.excerpt || "",
    category: article.category || "Economy",
    tags: article.tags || [],
    coverImage: article.coverImage || "",
    featured: Boolean(article.featured),
    author: article.author || "Editorial Desk",
    status: article.status,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    updatedAt: article.updatedAt ? article.updatedAt.toISOString() : null,
    blocks: article.blocks || [],
  };
}

function serializeArticle(doc) {
  const article = doc.toObject({ versionKey: false });
  return {
    id: String(article._id),
    title: article.title,
    slug: article.slug,
    kicker: article.kicker || "",
    excerpt: article.excerpt || "",
    category: article.category || "Economy",
    tags: article.tags || [],
    coverImage: article.coverImage || "",
    featured: Boolean(article.featured),
    author: article.author || "Editorial Desk",
    status: article.status,
    publishedAt: article.publishedAt
      ? article.publishedAt.toISOString()
      : null,
    updatedAt: article.updatedAt.toISOString(),
    views: article.views || 0,
    blocks: article.blocks || [],
  };
}

module.exports = { serializeUser, serializePage, serializeArticle };
