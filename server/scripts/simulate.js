import "dotenv/config";
import mongoose from "mongoose";
import Asset from "../models/Asset.js";

// Simulates real-time asset movement on the map
const simulate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🎯 Asset simulation started - assets are now moving");

    // Connect to Socket.IO server as a client to broadcast updates
    // Directly update DB and let the frontend poll or use its own connection

    const moveAsset = (coords, maxDelta = 0.002) => {
      const lng = coords[0] + (Math.random() - 0.5) * maxDelta;
      const lat = coords[1] + (Math.random() - 0.5) * maxDelta;
      return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))];
    };

    setInterval(async () => {
      try {
        const activeAssets = await Asset.find({ status: "Active" });

        for (const asset of activeAssets) {
          const newCoords = moveAsset(
            asset.location.coordinates,
            asset.type === "UAV" ? 0.004 : 0.002,
          );

          await Asset.findByIdAndUpdate(asset._id, {
            "location.coordinates": newCoords,
          });
        }

        console.log(
          `  Moved ${activeAssets.length} assets at ${new Date().toLocaleTimeString()}`,
        );
      } catch (err) {
        console.error("Move error:", err.message);
      }
    }, 3000);
  } catch (error) {
    console.error("Simulation error:", error);
    process.exit(1);
  }
};

simulate();
