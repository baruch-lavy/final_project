import Message from "../models/Message.js";

export const getMessages = async (req, res, next) => {
  try {
    const { channel } = req.params;
    const messages = await Message.find({ channel })
      .populate("sender", "username role avatar")
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { channel, content, type } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      channel: channel || "general",
      content,
      type: type || "text",
    });

    const populated = await Message.findById(message._id).populate(
      "sender",
      "username role avatar",
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("message:new", populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const getChannels = async (req, res, next) => {
  try {
    const channels = await Message.distinct("channel");
    res.json(channels);
  } catch (error) {
    next(error);
  }
};
