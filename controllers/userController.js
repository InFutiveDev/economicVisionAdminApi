const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { serializeUser } = require("../utils/serializers");

const ROLES = ["admin", "user"];
const MIN_PASSWORD = 6;

function readRole(value) {
  return ROLES.includes(value) ? value : "user";
}

async function listUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users: users.map(serializeUser) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
}

async function createUser(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (password.length < MIN_PASSWORD) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${MIN_PASSWORD} characters.` });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: readRole(req.body.role),
    });

    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    res.status(400).json({ message: "Failed to create user", error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const name = String(req.body.name ?? user.name).trim();
    const email = String(req.body.email ?? user.email).trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }
    if (email !== user.email && (await User.exists({ email }))) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }
    if (password && password.length < MIN_PASSWORD) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${MIN_PASSWORD} characters.` });
    }

    const role = req.body.role === undefined ? user.role : readRole(req.body.role);
    if (String(user._id) === req.user.id && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin access." });
    }

    user.name = name;
    user.email = email;
    user.role = role;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ user: serializeUser(user) });
  } catch (error) {
    res.status(400).json({ message: "Failed to update user", error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ deleted: true });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete user", error: error.message });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
