import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Therapist } from "../models/Therapist";
import { Appointment } from "../models/Appointment";
import { normalizeAppointments } from "../utils/appointmentTime";

const safeTherapist = (therapist: any) => {
  const data = therapist.toObject ? therapist.toObject() : therapist;
  const { password, ...safeData } = data;
  return safeData;
};

export const therapistRegister = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      qualification,
      specialization,
      experienceYears,
      hourlyRate,
      bio,
      certificateUrl,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !qualification ||
      !specialization ||
      experienceYears === undefined ||
      hourlyRate === undefined ||
      !bio
    ) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const existingTherapist = await Therapist.findOne({ email });
    if (existingTherapist) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const therapist = await Therapist.create({
      name,
      email,
      password: hashedPassword,
      phone,
      qualification,
      specialization,
      experienceYears,
      hourlyRate,
      bio,
      certificateUrl,
    });

    res.status(201).json({
      therapist: safeTherapist(therapist),
      message: "Your request has been sent to admin for verification.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const therapistLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const therapist = await Therapist.findOne({ email });
    if (!therapist) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, therapist.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { therapistId: therapist._id, role: "therapist" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    );

    res.json({
      therapist: safeTherapist(therapist),
      token,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getTherapistProfile = async (req: Request, res: Response) => {
  res.json({ therapist: req.user });
};

export const updateTherapistProfile = async (req: Request, res: Response) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "qualification",
      "specialization",
      "experienceYears",
      "hourlyRate",
      "bio",
      "certificateUrl",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );

    const therapist = await Therapist.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ therapist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getTherapistAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await Appointment.find({ therapistId: req.user._id })
      .populate("patientId", "name email")
      .sort({ startTime: 1, date: 1, time: 1 });

    const normalizedAppointments = await normalizeAppointments(appointments);
    console.log("Appointment:", normalizedAppointments);

    res.json({ appointments: normalizedAppointments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateTherapistAvailability = async (req: Request, res: Response) => {
  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: "Availability must be an array." });
    }

    const normalizedAvailability = availability.map((slot) => {
      if (!slot.date || !slot.startTime || !slot.endTime) {
        throw new Error("Each slot needs date, startTime, and endTime.");
      }

      return {
        _id: slot._id,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: Boolean(slot.isBooked),
      };
    });

    const therapist = await Therapist.findByIdAndUpdate(
      req.user._id,
      { availability: normalizedAvailability },
      { new: true, runValidators: true },
    ).select("-password");

    res.json({ therapist, message: "Availability updated successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message });
  }
};
