const { uploadImage } = require("../helper/firebase");

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Choose an image file." });
  }

  try {
    const uploaded = await uploadImage(req.file);
    res.status(201).json(uploaded);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Could not upload image.",
    });
  }
}

module.exports = { uploadFile };
