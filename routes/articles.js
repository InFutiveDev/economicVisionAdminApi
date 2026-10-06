const express = require("express");
const {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  publishArticle,
} = require("../controllers/articleController");

const router = express.Router();

router.get("/", listArticles);
router.get("/:id", getArticle);
router.post("/", createArticle);
router.put("/:id", updateArticle);
router.post("/:id/publish", publishArticle);

module.exports = router;
