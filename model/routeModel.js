const mongoose = require("mongoose");

const routeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});

const Route = mongoose.model("Routes", routeSchema);

module.exports = Route;
