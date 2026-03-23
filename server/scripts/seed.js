import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Mission from "../models/Mission.js";
import Asset from "../models/Asset.js";
import Message from "../models/Message.js";
import Event from "../models/Event.js";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Mission.deleteMany({}),
      Asset.deleteMany({}),
      Message.deleteMany({}),
      Event.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Create users
    const users = await User.create([
      {
        username: "Commander_Hawk",
        email: "hawk@aegis.mil",
        password: "password123",
        role: "Commander",
        status: "online",
      },
      {
        username: "Op_Viper",
        email: "viper@aegis.mil",
        password: "password123",
        role: "Operator",
        status: "online",
      },
      {
        username: "Op_Falcon",
        email: "falcon@aegis.mil",
        password: "password123",
        role: "Operator",
        status: "online",
      },
      {
        username: "Analyst_Eagle",
        email: "eagle@aegis.mil",
        password: "password123",
        role: "Analyst",
        status: "offline",
      },
      {
        username: "Op_Wolf",
        email: "wolf@aegis.mil",
        password: "password123",
        role: "Operator",
        status: "online",
      },
    ]);
    console.log(`Created ${users.length} users`);

    const [hawk, viper, falcon, eagle, wolf] = users;

    // Create missions (centered around a fictional operational area)
    const missions = await Mission.create([
      {
        title: "Operation Iron Shield",
        description:
          "Establish perimeter defense around the northern sector. Coordinate vehicle patrols and UAV surveillance.",
        status: "Active",
        priority: "Critical",
        assignedTo: [viper._id, falcon._id],
        location: { type: "Point", coordinates: [34.78, 32.08] },
        area: {
          type: "Polygon",
          coordinates: [
            [
              [34.76, 32.06],
              [34.8, 32.06],
              [34.8, 32.1],
              [34.76, 32.1],
              [34.76, 32.06],
            ],
          ],
        },
        startTime: new Date(),
        createdBy: hawk._id,
        updates: [
          {
            message: "Mission initiated. All units moving to positions.",
            author: hawk._id,
            timestamp: new Date(Date.now() - 3600000),
          },
          {
            message: "Perimeter checkpoint Alpha established.",
            author: viper._id,
            timestamp: new Date(Date.now() - 1800000),
          },
        ],
      },
      {
        title: "Recon Mission Delta",
        description:
          "Long-range reconnaissance of the eastern corridor. Report all movement and activity.",
        status: "Active",
        priority: "High",
        assignedTo: [wolf._id],
        location: { type: "Point", coordinates: [34.85, 32.12] },
        area: {
          type: "Polygon",
          coordinates: [
            [
              [34.83, 32.1],
              [34.87, 32.1],
              [34.87, 32.14],
              [34.83, 32.14],
              [34.83, 32.1],
            ],
          ],
        },
        startTime: new Date(Date.now() - 7200000),
        createdBy: hawk._id,
        updates: [
          {
            message: "Recon team deployed to sector E4.",
            author: hawk._id,
            timestamp: new Date(Date.now() - 7200000),
          },
        ],
      },
      {
        title: "Supply Route Bravo",
        description:
          "Secure and maintain supply corridor from base to forward operating position.",
        status: "Planning",
        priority: "Medium",
        assignedTo: [falcon._id],
        location: { type: "Point", coordinates: [34.72, 32.05] },
        createdBy: hawk._id,
      },
      {
        title: "Operation Silent Watch",
        description:
          "Covert surveillance operation in urban sector. Maintain low profile, report via encrypted channels.",
        status: "Active",
        priority: "High",
        assignedTo: [viper._id, wolf._id],
        location: { type: "Point", coordinates: [34.82, 32.02] },
        area: {
          type: "Polygon",
          coordinates: [
            [
              [34.8, 32.0],
              [34.84, 32.0],
              [34.84, 32.04],
              [34.8, 32.04],
              [34.8, 32.0],
            ],
          ],
        },
        startTime: new Date(Date.now() - 14400000),
        createdBy: hawk._id,
        updates: [
          {
            message: "Surveillance equipment deployed.",
            author: viper._id,
            timestamp: new Date(Date.now() - 14400000),
          },
          {
            message: "Position compromised — relocating to backup site.",
            author: wolf._id,
            timestamp: new Date(Date.now() - 3600000),
          },
          {
            message: "New position secured. Surveillance resumed.",
            author: viper._id,
            timestamp: new Date(Date.now() - 1200000),
          },
        ],
      },
      {
        title: "Base Fortification",
        description:
          "Reinforce main base defensive structures and upgrade communication arrays.",
        status: "Completed",
        priority: "Low",
        assignedTo: [falcon._id],
        location: { type: "Point", coordinates: [34.75, 32.07] },
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date(Date.now() - 43200000),
        createdBy: hawk._id,
        updates: [
          {
            message: "Fortification complete. All systems operational.",
            author: falcon._id,
            timestamp: new Date(Date.now() - 43200000),
          },
        ],
      },
      {
        title: "Operation Sandstorm",
        description:
          "Rapid response interception in the western desert sector. Prepare for potential engagement.",
        status: "Planning",
        priority: "Critical",
        assignedTo: [viper._id, wolf._id, falcon._id],
        location: { type: "Point", coordinates: [34.68, 32.15] },
        area: {
          type: "Polygon",
          coordinates: [
            [
              [34.65, 32.12],
              [34.71, 32.12],
              [34.71, 32.18],
              [34.65, 32.18],
              [34.65, 32.12],
            ],
          ],
        },
        createdBy: hawk._id,
      },
    ]);
    console.log(`Created ${missions.length} missions`);

    // Create assets
    const assets = await Asset.create([
      // Vehicles
      {
        name: "Humvee Alpha-1",
        type: "Vehicle",
        status: "Active",
        location: { type: "Point", coordinates: [34.77, 32.07] },
        assignedMission: missions[0]._id,
        icon: "vehicle",
      },
      {
        name: "Humvee Alpha-2",
        type: "Vehicle",
        status: "Active",
        location: { type: "Point", coordinates: [34.79, 32.09] },
        assignedMission: missions[0]._id,
        icon: "vehicle",
      },
      {
        name: "APC Bravo-1",
        type: "Vehicle",
        status: "Active",
        location: { type: "Point", coordinates: [34.84, 32.11] },
        assignedMission: missions[1]._id,
        icon: "vehicle",
      },
      {
        name: "Transport Truck T-3",
        type: "Vehicle",
        status: "Idle",
        location: { type: "Point", coordinates: [34.74, 32.06] },
        icon: "vehicle",
      },
      // UAVs
      {
        name: "Drone Reaper-1",
        type: "UAV",
        status: "Active",
        location: { type: "Point", coordinates: [34.78, 32.08] },
        assignedMission: missions[0]._id,
        icon: "uav",
      },
      {
        name: "Drone Shadow-2",
        type: "UAV",
        status: "Active",
        location: { type: "Point", coordinates: [34.86, 32.13] },
        assignedMission: missions[1]._id,
        icon: "uav",
      },
      {
        name: "Drone Hawk-3",
        type: "UAV",
        status: "Active",
        location: { type: "Point", coordinates: [34.81, 32.03] },
        assignedMission: missions[3]._id,
        icon: "uav",
      },
      {
        name: "Drone Scout-4",
        type: "UAV",
        status: "Maintenance",
        location: { type: "Point", coordinates: [34.75, 32.07] },
        icon: "uav",
      },
      // Personnel
      {
        name: "Fire Team Alpha",
        type: "Personnel",
        status: "Active",
        location: { type: "Point", coordinates: [34.78, 32.09] },
        assignedMission: missions[0]._id,
        icon: "personnel",
      },
      {
        name: "Fire Team Bravo",
        type: "Personnel",
        status: "Active",
        location: { type: "Point", coordinates: [34.83, 32.01] },
        assignedMission: missions[3]._id,
        icon: "personnel",
      },
      {
        name: "Recon Team Delta",
        type: "Personnel",
        status: "Active",
        location: { type: "Point", coordinates: [34.85, 32.12] },
        assignedMission: missions[1]._id,
        icon: "personnel",
      },
      {
        name: "Support Team Echo",
        type: "Personnel",
        status: "Idle",
        location: { type: "Point", coordinates: [34.75, 32.07] },
        icon: "personnel",
      },
      // Equipment
      {
        name: "Comms Relay Station",
        type: "Equipment",
        status: "Active",
        location: { type: "Point", coordinates: [34.76, 32.08] },
        icon: "equipment",
      },
      {
        name: "Field Medical Unit",
        type: "Equipment",
        status: "Active",
        location: { type: "Point", coordinates: [34.75, 32.065] },
        icon: "equipment",
      },
      {
        name: "Radar Station RS-1",
        type: "Equipment",
        status: "Active",
        location: { type: "Point", coordinates: [34.8, 32.11] },
        icon: "equipment",
      },
    ]);
    console.log(`Created ${assets.length} assets`);

    // Create messages
    await Message.create([
      {
        sender: hawk._id,
        channel: "general",
        content:
          "All units, this is Command. Operation Iron Shield is now active. Report status.",
        type: "alert",
      },
      {
        sender: viper._id,
        channel: "general",
        content: "Viper here. Team Alpha moving into position. ETA 15 minutes.",
        type: "text",
      },
      {
        sender: falcon._id,
        channel: "general",
        content: "Falcon reporting. Checkpoint Charlie is secure.",
        type: "text",
      },
      {
        sender: wolf._id,
        channel: "general",
        content:
          "Wolf here. Recon team has eyes on sector E4. No movement detected.",
        type: "text",
      },
      {
        sender: hawk._id,
        channel: "general",
        content: "Copy all. Maintain positions. Next check-in at 1400.",
        type: "text",
      },
      {
        sender: viper._id,
        channel: missions[0]._id.toString(),
        content: "Iron Shield perimeter established. All checkpoints manned.",
        type: "text",
      },
      {
        sender: hawk._id,
        channel: missions[0]._id.toString(),
        content: "Good work. UAV Reaper-1 is providing overwatch.",
        type: "text",
      },
      {
        sender: wolf._id,
        channel: missions[1]._id.toString(),
        content:
          "Movement detected at grid reference 34.86, 32.13. Investigating.",
        type: "alert",
      },
      {
        sender: hawk._id,
        channel: missions[1]._id.toString(),
        content:
          "Proceed with caution. Shadow-2 is redirecting for aerial support.",
        type: "text",
      },
      {
        sender: hawk._id,
        channel: "general",
        content:
          "⚠️ ALERT: Unidentified activity in eastern sector. All units standby.",
        type: "alert",
      },
    ]);
    console.log("Created messages");

    // Create events
    await Event.create([
      {
        type: "mission_created",
        description: "Operation Iron Shield created",
        relatedMission: missions[0]._id,
        createdBy: hawk._id,
      },
      {
        type: "mission_created",
        description: "Recon Mission Delta created",
        relatedMission: missions[1]._id,
        createdBy: hawk._id,
      },
      {
        type: "mission_status_changed",
        description: "Operation Iron Shield → Active",
        relatedMission: missions[0]._id,
        createdBy: hawk._id,
      },
      {
        type: "asset_created",
        description: "Drone Reaper-1 deployed",
        relatedAsset: assets[4]._id,
        createdBy: hawk._id,
      },
      {
        type: "asset_moved",
        description: "Fire Team Alpha moving to position",
        relatedAsset: assets[8]._id,
        createdBy: viper._id,
      },
      {
        type: "mission_created",
        description: "Operation Silent Watch created",
        relatedMission: missions[3]._id,
        createdBy: hawk._id,
      },
      {
        type: "mission_status_changed",
        description: "Operation Silent Watch → Active",
        relatedMission: missions[3]._id,
        createdBy: hawk._id,
      },
      {
        type: "alert",
        description: "Unidentified activity detected in eastern sector",
        createdBy: eagle._id,
      },
      {
        type: "mission_created",
        description: "Operation Sandstorm created (Planning)",
        relatedMission: missions[5]._id,
        createdBy: hawk._id,
      },
      {
        type: "asset_status_changed",
        description: "Drone Scout-4 → Maintenance",
        relatedAsset: assets[7]._id,
        createdBy: falcon._id,
      },
    ]);
    console.log("Created events");

    console.log("\n✅ AEGIS database seeded successfully!");
    console.log("\n📋 Demo accounts:");
    console.log("   Commander:  hawk@aegis.mil / password123");
    console.log("   Operator:   viper@aegis.mil / password123");
    console.log("   Operator:   falcon@aegis.mil / password123");
    console.log("   Analyst:    eagle@aegis.mil / password123");
    console.log("   Operator:   wolf@aegis.mil / password123");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
