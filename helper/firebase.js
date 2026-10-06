const fs = require("fs");
const path = require("path");
const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");

const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

class UploadConfigError extends Error {}

// FIREBASE_SERVICE_ACCOUNT may be a path to the key file or the key JSON itself.
function serviceAccountFromSetting(setting) {
  const value = setting.trim();
  if (value.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch {
      throw new UploadConfigError("FIREBASE_SERVICE_ACCOUNT contains invalid JSON.");
    }
  }

  const file = path.resolve(value);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function getServiceAccount() {
  const setting = process.env.FIREBASE_SERVICE_ACCOUNT;
  const fromSetting = setting ? serviceAccountFromSetting(setting) : null;
  if (fromSetting) return fromSetting;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new UploadConfigError(
      setting
        ? `Firebase key file not found at ${path.resolve(setting)}. Copy firebase-service-account.json to the server, or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.`
        : "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function getFirebaseApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const serviceAccount = getServiceAccount();
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.appspot.com`;

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket,
  });
}

function fileExtension(file) {
  return (
    ALLOWED_TYPES[file.mimetype] ||
    path.extname(file.originalname || "").toLowerCase() ||
    ".jpg"
  );
}

function storagePath(file) {
  const folder = process.env.FIREBASE_UPLOAD_FOLDER || "articles";
  const stamp = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  return `${folder}/${stamp}${fileExtension(file)}`;
}

async function uploadImage(file, folder) {
  if (!file?.buffer) {
    throw new Error("Choose an image file.");
  }

  if (!ALLOWED_TYPES[file.mimetype]) {
    throw new Error("Choose a PNG, JPG, GIF, or WebP image.");
  }

  const app = getFirebaseApp();
  const bucket = getStorage(app).bucket();
  const destination = folder
    ? `${folder.replace(/\/$/, "")}/${path.basename(storagePath(file))}`
    : storagePath(file);
  const blob = bucket.file(destination);

  await blob.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
      cacheControl: "public, max-age=31536000",
    },
    resumable: false,
  });

  await blob.makePublic();

  return {
    url: `https://storage.googleapis.com/${bucket.name}/${destination}`,
    path: destination,
  };
}

module.exports = {
  ALLOWED_TYPES,
  UploadConfigError,
  getFirebaseApp,
  uploadImage,
};
