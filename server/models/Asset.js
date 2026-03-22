const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: ["Vehicle", "Personnel", "Equipment", "UAV"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Idle", "Maintenance"],
      default: "Idle",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    assignedMission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      default: null,
    },
    icon: {
      type: String,
      default: "default",
    },
  },
  { timestamps: true },
);

assetSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Asset", assetSchema);
