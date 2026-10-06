const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  getPage,
  createPage,
  updatePage,
  publishPage,
} = require("../controllers/pageController");

const router = express.Router();

router.get("/:id", getPage);
router.post("/", createPage);
router.put("/:id", updatePage);
router.post("/:id/publish", requireAdmin, publishPage);

module.exports = router;
