const { validationResult } = require("express-validator");
const Mission = require("../models/Mission");
const Event = require("../models/Event");

exports.getMissions = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const missions = await Mission.find(filter)
      .populate("createdBy", "username role")
      .populate("assignedTo", "username role")
      .sort({ createdAt: -1 });
    res.json(missions);
  } catch (error) {
    next(error);
  }
};

exports.getMission = async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id)
      .populate("createdBy", "username role")
      .populate("assignedTo", "username role avatar")
      .populate("updates.author", "username role");
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }
    res.json(mission);
  } catch (error) {
    next(error);
  }
};

exports.createMission = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const mission = await Mission.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populated = await Mission.findById(mission._id)
      .populate("createdBy", "username role")
      .populate("assignedTo", "username role");

    await Event.create({
      type: "mission_created",
      description: `Mission "${mission.title}" created by ${req.user.username}`,
      relatedMission: mission._id,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("mission:created", populated);
      io.emit("event:new", {
        type: "mission_created",
        description: `Mission "${mission.title}" created`,
        createdBy: req.user,
        createdAt: new Date(),
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

exports.updateMission = async (req, res, next) => {
  try {
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    )
      .populate("createdBy", "username role")
      .populate("assignedTo", "username role");

    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    await Event.create({
      type: "mission_updated",
      description: `Mission "${mission.title}" updated by ${req.user.username}`,
      relatedMission: mission._id,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("mission:updated", mission);
      io.emit("event:new", {
        type: "mission_updated",
        description: `Mission "${mission.title}" updated`,
        createdBy: req.user,
        createdAt: new Date(),
      });
    }

    res.json(mission);
  } catch (error) {
    next(error);
  }
};

exports.updateMissionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    )
      .populate("createdBy", "username role")
      .populate("assignedTo", "username role");

    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    await Event.create({
      type: "mission_status_changed",
      description: `Mission "${mission.title}" status changed to ${status}`,
      relatedMission: mission._id,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("mission:statusChanged", mission);
      io.emit("event:new", {
        type: "mission_status_changed",
        description: `Mission "${mission.title}" → ${status}`,
        createdBy: req.user,
        createdAt: new Date(),
      });
    }

    res.json(mission);
  } catch (error) {
    next(error);
  }
};

exports.addMissionUpdate = async (req, res, next) => {
  try {
    const { message } = req.body;
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          updates: { message, author: req.user._id, timestamp: new Date() },
        },
      },
      { new: true },
    )
      .populate("createdBy", "username role")
      .populate("assignedTo", "username role")
      .populate("updates.author", "username role");

    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("mission:updated", mission);
    }

    res.json(mission);
  } catch (error) {
    next(error);
  }
};

exports.deleteMission = async (req, res, next) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    await Event.create({
      type: "mission_deleted",
      description: `Mission "${mission.title}" deleted by ${req.user.username}`,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("mission:deleted", { _id: req.params.id });
      io.emit("event:new", {
        type: "mission_deleted",
        description: `Mission "${mission.title}" deleted`,
        createdBy: req.user,
        createdAt: new Date(),
      });
    }

    res.json({ message: "Mission deleted" });
  } catch (error) {
    next(error);
  }
};

exports.getMissionStats = async (req, res, next) => {
  try {
    const [statusStats, priorityStats, totalMissions] = await Promise.all([
      Mission.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Mission.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Mission.countDocuments(),
    ]);

    res.json({ statusStats, priorityStats, totalMissions });
  } catch (error) {
    next(error);
  }
};
