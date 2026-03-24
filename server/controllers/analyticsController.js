import Mission from "../models/Mission.js";
import Asset from "../models/Asset.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      missionsByStatus,
      missionsByPriority,
      assetsByType,
      assetsByStatus,
      totalMissions,
      totalAssets,
      totalPersonnel,
      onlinePersonnel,
      recentEvents,
      missionTimeline,
    ] = await Promise.all([
      Mission.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Mission.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Mission.countDocuments(),
      Asset.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ status: "online" }),
      Event.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("createdBy", "username role"),
      Mission.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    // Threat level calculation based on active critical/high missions
    const criticalActive = missionsByPriority.find((p) => p._id === "Critical");
    const highActive = missionsByPriority.find((p) => p._id === "High");
    const critCount = criticalActive?.count || 0;
    const highCount = highActive?.count || 0;
    let threatLevel = "LOW";
    if (critCount >= 3 || highCount >= 5) threatLevel = "CRITICAL";
    else if (critCount >= 1 || highCount >= 3) threatLevel = "HIGH";
    else if (highCount >= 1) threatLevel = "MODERATE";

    // Asset readiness score
    const activeAssets =
      assetsByStatus.find((s) => s._id === "Active")?.count || 0;
    const idleAssets = assetsByStatus.find((s) => s._id === "Idle")?.count || 0;
    const maintAssets =
      assetsByStatus.find((s) => s._id === "Maintenance")?.count || 0;
    const readiness =
      totalAssets > 0
        ? Math.round(((activeAssets + idleAssets) / totalAssets) * 100)
        : 100;

    res.json({
      overview: {
        totalMissions,
        totalAssets,
        totalPersonnel,
        onlinePersonnel,
        threatLevel,
        readiness,
      },
      missionsByStatus,
      missionsByPriority,
      assetsByType,
      assetsByStatus,
      recentEvents,
      missionTimeline,
    });
  } catch (error) {
    next(error);
  }
};

export const getMissionHeatmap = async (req, res, next) => {
  try {
    const missions = await Mission.find(
      { "location.coordinates": { $exists: true } },
      { location: 1, priority: 1, status: 1 },
    );

    const points = missions
      .filter((m) => m.location?.coordinates?.length === 2)
      .map((m) => ({
        lat: m.location.coordinates[1],
        lng: m.location.coordinates[0],
        weight:
          m.priority === "Critical"
            ? 4
            : m.priority === "High"
              ? 3
              : m.priority === "Medium"
                ? 2
                : 1,
      }));

    res.json(points);
  } catch (error) {
    next(error);
  }
};

export const getActivityTimeline = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const events = await Event.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("createdBy", "username role");

    res.json(events);
  } catch (error) {
    next(error);
  }
};
