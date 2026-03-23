import Asset from "../models/Asset.js";
import Event from "../models/Event.js";

export const getAssets = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const assets = await Asset.find(filter)
      .populate("assignedMission", "title status")
      .sort({ name: 1 });
    res.json(assets);
  } catch (error) {
    next(error);
  }
};

export const getAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id).populate(
      "assignedMission",
      "title status priority",
    );
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    res.json(asset);
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req, res, next) => {
  try {
    const asset = await Asset.create(req.body);
    const populated = await Asset.findById(asset._id).populate(
      "assignedMission",
      "title status",
    );

    await Event.create({
      type: "asset_created",
      description: `Asset "${asset.name}" (${asset.type}) deployed`,
      relatedAsset: asset._id,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("asset:created", populated);
      io.emit("event:new", {
        type: "asset_created",
        description: `Asset "${asset.name}" deployed`,
        createdBy: req.user,
        createdAt: new Date(),
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ).populate("assignedMission", "title status");

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    await Event.create({
      type: "asset_updated",
      description: `Asset "${asset.name}" updated by ${req.user.username}`,
      relatedAsset: asset._id,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("asset:updated", asset);
    }

    res.json(asset);
  } catch (error) {
    next(error);
  }
};

export const updateAssetLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { "location.coordinates": coordinates },
      { new: true },
    ).populate("assignedMission", "title status");

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("asset:locationUpdated", {
        _id: asset._id,
        location: asset.location,
        name: asset.name,
        type: asset.type,
      });
    }

    res.json(asset);
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    await Event.create({
      type: "asset_status_changed",
      description: `Asset "${asset.name}" removed from system`,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("asset:deleted", { _id: req.params.id });
    }

    res.json({ message: "Asset deleted" });
  } catch (error) {
    next(error);
  }
};

export const getAssetStats = async (req, res, next) => {
  try {
    const [typeStats, statusStats, totalAssets] = await Promise.all([
      Asset.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Asset.countDocuments(),
    ]);

    res.json({ typeStats, statusStats, totalAssets });
  } catch (error) {
    next(error);
  }
};
