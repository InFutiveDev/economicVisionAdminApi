const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");

const router = express.Router();
const uploadsDir = path.join(__dirname, "../public/uploads");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename(req, file, callback) {
      const extension = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`);
    },
  }),
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
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5MB or smaller."
            : error.message || "Could not upload image.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Choose an image file." });
    }

    res.status(201).json({
      url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    });
  });
});

module.exports = router;
