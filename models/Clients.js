const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    duration: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
