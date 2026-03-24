import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

const setupSocket = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`⚡ ${socket.user.username} connected`);

    // Mark user online
    await User.findByIdAndUpdate(socket.user._id, { status: "online" });
    io.emit("user:online", {
      userId: socket.user._id,
      username: socket.user.username,
    });

    // Join user to their personal room and general channel
    socket.join(`user:${socket.user._id}`);
    socket.join("channel:general");

    // Join channel
    socket.on("channel:join", (channel) => {
      socket.join(`channel:${channel}`);
    });

    // Leave channel
    socket.on("channel:leave", (channel) => {
      socket.leave(`channel:${channel}`);
    });

    // ── Typing indicators ─────────────────────────────────────────
    socket.on("typing:start", ({ channel }) => {
      socket.to(`channel:${channel}`).emit("typing:update", {
        userId: socket.user._id,
        username: socket.user.username,
        channel,
        isTyping: true,
      });
    });

    socket.on("typing:stop", ({ channel }) => {
      socket.to(`channel:${channel}`).emit("typing:update", {
        userId: socket.user._id,
        username: socket.user.username,
        channel,
        isTyping: false,
      });
    });

    // ── Message reactions ─────────────────────────────────────────
    socket.on("message:react", async ({ messageId, emoji }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        // Toggle reaction
        const existing = (msg.reactions || []).find(
          (r) =>
            r.emoji === emoji &&
            r.user.toString() === socket.user._id.toString(),
        );

        if (existing) {
          msg.reactions = msg.reactions.filter(
            (r) =>
              !(
                r.emoji === emoji &&
                r.user.toString() === socket.user._id.toString()
              ),
          );
        } else {
          if (!msg.reactions) msg.reactions = [];
          msg.reactions.push({ emoji, user: socket.user._id });
        }

        await msg.save();
        io.to(`channel:${msg.channel}`).emit("message:reacted", {
          messageId,
          reactions: msg.reactions,
        });
      } catch {
        /* ignore invalid ids */
      }
    });

    // Relay asset location updates from the simulation script to all clients
    socket.on("simulate:locationUpdate", (assetData) => {
      io.emit("asset:locationUpdated", assetData);
    });

    // Broadcast alert from commander
    socket.on("alert:broadcast", async ({ message, priority, from }) => {
      if (socket.user.role !== "Commander") return;

      const alertData = {
        message,
        priority: priority || "high",
        from: from || socket.user.username,
        timestamp: new Date(),
      };

      io.emit("alert:received", alertData);

      // Create notifications for all users
      const users = await User.find({ _id: { $ne: socket.user._id } }, "_id");
      const notifications = users.map((u) => ({
        user: u._id,
        type: "alert",
        title: `ALERT: ${message}`,
        body: `Priority: ${alertData.priority.toUpperCase()} — From: ${alertData.from}`,
        meta: { priority: alertData.priority },
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        for (const u of users) {
          io.to(`user:${u._id}`).emit("notification:new", {
            type: "alert",
            title: `ALERT: ${message}`,
          });
        }
      }
    });

    // ── Alert acknowledgment ──────────────────────────────────────
    socket.on("alert:ack", ({ alertTimestamp }) => {
      io.emit("alert:acknowledged", {
        userId: socket.user._id,
        username: socket.user.username,
        alertTimestamp,
      });
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`⚡ ${socket.user.username} disconnected`);
      await User.findByIdAndUpdate(socket.user._id, { status: "offline" });
      io.emit("user:offline", {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });
  });
};

export default setupSocket;
