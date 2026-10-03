require("dotenv").config();

const mongoose = require("mongoose");
const Article = require("../models/Article");

const samples = [
  {
    title: "RBI holds rates as inflation eases",
    slug: "rbi-holds-rates-as-inflation-eases",
    kicker: "Policy",
    excerpt:
      "The central bank kept the repo rate unchanged after core inflation cooled for a third month.",
    category: "Policy",
    tags: ["rbi", "inflation"],
    coverImage: "",
    featured: true,
    author: "Asha Rao",
    status: "published",
    publishedAt: new Date("2026-10-03T08:00:00.000Z"),
    views: 1280,
    blocks: [
      { id: "b1", type: "heading", data: { text: "What the MPC said", level: 2 } },
      {
        id: "b2",
        type: "paragraph",
        data: {
          text: "The central bank kept the repo rate unchanged after core inflation cooled for a third month.",
        },
      },
    ],
  },
  {
    title: "Oil slips as demand fears outweigh supply cuts",
    slug: "oil-slips-demand-fears",
    kicker: "Commodities",
    excerpt: "Brent trades lower after inventory data missed estimates.",
    category: "Commodities",
    tags: ["oil", "commodities"],
    coverImage: "",
    featured: false,
    author: "Elena Voss",
    status: "draft",
    publishedAt: null,
    views: 0,
    blocks: [
      {
        id: "b1",
        type: "paragraph",
        data: { text: "Brent trades lower after inventory data missed estimates." },
      },
    ],
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const item of samples) {
    await Article.findOneAndUpdate({ slug: item.slug }, item, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  const articles = await Article.find().sort({ updatedAt: -1 }).lean();
  console.log(
    JSON.stringify(
      articles.map((article) => ({
        id: String(article._id),
        title: article.title,
        slug: article.slug || null,
        status: article.status || "draft",
        category: article.category || article.articleCategory || "",
      })),
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
