import { Request, Response, NextFunction } from "express";
import { Mood } from "../models/Mood";
import { logger } from "../utils/logger";
import { sendMoodUpdateEvent } from "../utils/inngestEvents";

const periodToStartDate = (period: string): Date => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (period === "month") {
    start.setDate(1);
    return start;
  }

  if (period === "year") {
    start.setMonth(0, 1);
    return start;
  }

  start.setDate(start.getDate() - 6);
  return start;
};

// Create a new mood entry
export const createMood = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { score, note, context, activities } = req.body;
    const userId = req.user?._id; // From auth middleware

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const mood = new Mood({
      userId,
      score,
      note,
      context,
      activities,
      timestamp: new Date(),
    });

    await mood.save();
    logger.info(`Mood entry created for user ${userId}`);

    // Send mood update event to Inngest
    await sendMoodUpdateEvent({
      userId,
      mood: score,
      note,
      context,
      activities,
      timestamp: mood.timestamp,
    });

    res.status(201).json({
      success: true,
      data: mood,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { startDate, endDate, limit } = req.query;
    const filter: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        (filter.timestamp as Record<string, Date>).$gte = new Date(
          startDate as string,
        );
      }
      if (endDate) {
        (filter.timestamp as Record<string, Date>).$lte = new Date(
          endDate as string,
        );
      }
    }

    let query = Mood.find(filter).sort({ timestamp: -1 });

    if (limit) {
      query = query.limit(Number(limit));
    }

    const moods = await query.exec();

    res.json({
      success: true,
      data: moods,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const period = (req.query.period as string) || "week";
    const startDate = periodToStartDate(period);

    const moods = await Mood.find({
      userId,
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: -1 })
      .exec();

    if (moods.length === 0) {
      return res.json({
        success: true,
        data: {
          average: 0,
          count: 0,
          highest: 0,
          lowest: 0,
          history: [],
        },
      });
    }

    const scores = moods.map((mood) => mood.score);

    res.json({
      success: true,
      data: {
        average: Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length,
        ),
        count: moods.length,
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
        history: moods,
      },
    });
  } catch (error) {
    next(error);
  }
};
