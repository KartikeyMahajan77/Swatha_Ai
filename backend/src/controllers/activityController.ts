import { Request, Response, NextFunction } from "express";
import { Activity, IActivity } from "../models/Activity";
import { Mood } from "../models/Mood";
import { logger } from "../utils/logger";
import { sendActivityCompletionEvent } from "../utils/inngestEvents";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// Log a new activity
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, name, description, duration, difficulty, feedback } =
      req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const activity = new Activity({
      userId,
      type,
      name,
      description,
      duration,
      difficulty,
      feedback,
      timestamp: new Date(),
    });

    await activity.save();
    logger.info(`Activity logged for user ${userId}`);

    // Send activity completion event to Inngest
    await sendActivityCompletionEvent({
      userId,
      id: activity._id,
      type,
      name,
      duration,
      difficulty,
      feedback,
      timestamp: activity.timestamp,
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodaysActivities = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { start, end } = getTodayRange();

    const [activities, moods] = await Promise.all([
      Activity.find({
        userId,
        timestamp: { $gte: start, $lt: end },
      })
        .sort({ timestamp: -1 })
        .exec(),
      Mood.find({
        userId,
        timestamp: { $gte: start, $lt: end },
      })
        .sort({ timestamp: -1 })
        .exec(),
    ]);

    const formattedActivities = activities.map((activity) => ({
      id: activity._id.toString(),
      userId: activity.userId.toString(),
      type: activity.type,
      name: activity.name,
      description: activity.description || null,
      timestamp: activity.timestamp,
      duration: activity.duration ?? null,
      completed: true,
      moodScore: null,
      moodNote: null,
      createdAt: (activity as IActivity & { createdAt: Date }).createdAt,
      updatedAt: (activity as IActivity & { updatedAt: Date }).updatedAt,
    }));

    const formattedMoods = moods.map((mood) => ({
      id: mood._id.toString(),
      userId: mood.userId.toString(),
      type: "mood",
      name: "Mood Check-in",
      description: mood.note || null,
      timestamp: mood.timestamp,
      duration: null,
      completed: true,
      moodScore: mood.score,
      moodNote: mood.note || null,
      createdAt: mood.createdAt,
      updatedAt: mood.updatedAt,
    }));

    const combined = [...formattedMoods, ...formattedActivities].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    res.json(combined);
  } catch (error) {
    next(error);
  }
};
