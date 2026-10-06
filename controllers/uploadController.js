const { uploadImage, UploadConfigError } = require("../helper/firebase");

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Choose an image file." });
  }

  try {
    const uploaded = await uploadImage(req.file);
    res.status(201).json(uploaded);
  } catch (error) {
    if (error instanceof UploadConfigError) {
      console.error("[uploads]", error.message);
      return res.status(500).json({
        message: "Image uploads are not configured on the server. Ask an admin to set up Firebase.",
      });
    }
    console.error("[uploads]", error);
    res.status(400).json({
      message: error.message || "Could not upload image.",
    });
  }
}

module.exports = { uploadFile };
