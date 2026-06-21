import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Therapist } from "../models/Therapist";

export type AppointmentActorRole = "patient" | "therapist";

declare global {
  namespace Express {
    interface Request {
      appointmentActor?: {
        _id: any;
        role: AppointmentActorRole;
        name?: string;
        email?: string;
      };
    }
  }
}

export const protectAppointmentParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    ) as any;

    if (decoded.userId) {
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.appointmentActor = {
        _id: user._id,
        role: "patient",
        name: user.name,
        email: user.email,
      };
      return next();
    }

    if (decoded.therapistId) {
      const therapist = await Therapist.findById(decoded.therapistId).select(
        "-password",
      );
      if (!therapist) {
        return res.status(401).json({ message: "Therapist not found" });
      }

      req.appointmentActor = {
        _id: therapist._id,
        role: "therapist",
        name: therapist.name,
        email: therapist.email,
      };
      return next();
    }

    return res.status(401).json({ message: "Invalid authentication token" });
  } catch (error) {
    res.status(401).json({ message: "Invalid authentication token" });
  }
};
