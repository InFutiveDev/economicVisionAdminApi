require("dotenv").config();

const path = require("path");
const bcrypt = require("bcryptjs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const articleRoutes = require("./routes/articles");
const authRoutes = require("./routes/auth");
const pageRoutes = require("./routes/pages");
const uploadRoutes = require("./routes/uploads");
const { requireAuth } = require("./middleware/auth");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI =
  process.env.MONGODB_URI || "";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/articles", requireAuth, articleRoutes);
app.use("/api/pages", requireAuth, pageRoutes);
app.use("/api/uploads", requireAuth, uploadRoutes);

app.get("/api/health", (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    status: "ok",
    service: "Economic Vision Admin API",
    mongodb: states[mongoState] || "unknown",
  });
});

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@economicvision.com")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Asha Rao";

  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: "admin",
  });
  console.log(`Seeded admin account: ${email}`);
}

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required.");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
