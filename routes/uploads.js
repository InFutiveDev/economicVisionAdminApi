const express = require("express");
const { uploadSingleImage } = require("../middleware/upload");
const { uploadFile } = require("../controllers/uploadController");

const router = express.Router();

router.post("/", uploadSingleImage("file"), uploadFile);

module.exports = router;
