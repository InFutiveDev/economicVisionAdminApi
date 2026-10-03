const express = require("express");
const multer = require("multer");
const { ALLOWED_TYPES, uploadImage } = require("../helper/firebase");

const router = express.Router();
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter(req, file, callback) {
    if (!ALLOWED_TYPES[file.mimetype]) {
      callback(new Error("Choose a PNG, JPG, GIF, or WebP image."));
      return;
    }
    callback(null, true);
  },
});

router.post("/", (req, res) => {
  upload.single("file")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 50MB or smaller."
            : error.message || "Could not upload image.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Choose an image file." });
    }

    try {
      const uploaded = await uploadImage(req.file);
      res.status(201).json(uploaded);
    } catch (uploadError) {
      res.status(400).json({
        message: uploadError.message || "Could not upload image.",
      });
    }
  });
});

module.exports = router;
