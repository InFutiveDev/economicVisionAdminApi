const multer = require("multer");
const { ALLOWED_TYPES } = require("../helper/firebase");

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

function uploadSingleImage(field) {
  const handler = upload.single(field);

  return (req, res, next) => {
    handler(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "Image must be 50MB or smaller."
              : error.message || "Could not upload image.",
        });
      }
      next();
    });
  };
}

module.exports = { uploadSingleImage };
