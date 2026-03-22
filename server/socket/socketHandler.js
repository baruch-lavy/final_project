const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

module.exports = setupSocket;
