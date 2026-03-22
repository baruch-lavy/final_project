const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: String,
      required: true,
      default: "general",
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ["text", "alert", "system"],
      default: "text",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
