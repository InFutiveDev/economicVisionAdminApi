const mongoose = require("mongoose");

const MONGO_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

function getHealth(req, res) {
  res.json({
    status: "ok",
    service: "Economic Vision Admin API",
    mongodb: MONGO_STATES[mongoose.connection.readyState] || "unknown",
  });
}

module.exports = { getHealth };
