import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "mission_created",
        "mission_updated",
        "mission_status_changed",
        "mission_deleted",
        "asset_created",
        "asset_updated",
        "asset_moved",
        "asset_status_changed",
        "user_login",
        "user_logout",
        "alert",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedMission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
    },
    relatedAsset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Event", eventSchema);
