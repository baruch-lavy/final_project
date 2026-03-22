const Event = require("../models/Event");

exports.getEvents = async (req, res, next) => {
  try {
    const { type, limit } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const events = await Event.find(filter)
      .populate("createdBy", "username role")
      .populate("relatedMission", "title")
      .populate("relatedAsset", "name type")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const Mission = require("../models/Mission");
    const Asset = require("../models/Asset");
    const User = require("../models/User");

    const [
      totalMissions,
      activeMissions,
      missionsByStatus,
      missionsByPriority,
      totalAssets,
      assetsByType,
      assetsByStatus,
      onlineUsers,
      totalUsers,
      recentEvents,
    ] = await Promise.all([
      Mission.countDocuments(),
      Mission.countDocuments({ status: "Active" }),
      Mission.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Mission.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Asset.countDocuments(),
      Asset.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.countDocuments({ status: "online" }),
      User.countDocuments(),
      Event.find()
        .populate("createdBy", "username role")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.json({
      totalMissions,
      activeMissions,
      missionsByStatus,
      missionsByPriority,
      totalAssets,
      assetsByType,
      assetsByStatus,
      onlineUsers,
      totalUsers,
      recentEvents,
    });
  } catch (error) {
    next(error);
  }
};
