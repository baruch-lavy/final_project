import "dotenv/config";
import mongoose from "mongoose";
import { io as ioClient } from "socket.io-client";
import jwt from "jsonwebtoken";
import Asset from "../models/Asset.js";
import User from "../models/User.js";

// Simulates real-time asset movement on the map and broadcasts via Socket.IO
const simulate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🎯 Connected to MongoDB");

    // Find a commander user to generate a token for socket auth
    const admin = await User.findOne({ role: "Commander" });
    if (!admin) {
      console.error("No Commander user found — run npm run seed first");
      process.exit(1);
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Connect to the running server via Socket.IO to broadcast updates
    const serverUrl = `http://localhost:${process.env.PORT || 5000}`;
    const socket = ioClient(serverUrl, { auth: { token } });

    socket.on("connect", () => {
      console.log("⚡ Simulation socket connected — assets are now moving");
    });
    socket.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
    });

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

          // Broadcast real-time location update to all connected clients
          if (socket.connected) {
            socket.emit("simulate:locationUpdate", {
              _id: asset._id,
              name: asset.name,
              type: asset.type,
              status: asset.status,
              location: { type: "Point", coordinates: newCoords },
            });
          }
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
