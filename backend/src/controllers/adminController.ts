import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";
import { Therapist } from "../models/Therapist";
import { Appointment } from "../models/Appointment";

const safeAdmin = (admin: any) => {
  const data = admin.toObject ? admin.toObject() : admin;
  const { password, ...safeData } = data;
  return safeData;
};

export const adminRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const admin = await Admin.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });

    res.status(201).json({ admin: safeAdmin(admin), message: "Admin registered successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    );

    res.json({ admin: safeAdmin(admin), token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const [totalTherapists, pendingTherapists, verifiedTherapists, totalAppointments] =
      await Promise.all([
        Therapist.countDocuments(),
        Therapist.countDocuments({ verificationStatus: "pending" }),
        Therapist.countDocuments({ verificationStatus: "verified", isVerified: true }),
        Appointment.countDocuments(),
      ]);

    res.json({
      stats: {
        totalTherapists,
        pendingTherapists,
        verifiedTherapists,
        totalAppointments,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllTherapistsForAdmin = async (_req: Request, res: Response) => {
  const therapists = await Therapist.find().select("-password").sort({ createdAt: -1 });
  res.json({ therapists });
};

export const getPendingTherapists = async (_req: Request, res: Response) => {
  const therapists = await Therapist.find({ verificationStatus: "pending" })
    .select("-password")
    .sort({ createdAt: -1 });
  res.json({ therapists });
};

export const verifyTherapist = async (req: Request, res: Response) => {
  const therapist = await Therapist.findByIdAndUpdate(
    req.params.therapistId,
    { isVerified: true, verificationStatus: "verified" },
    { new: true },
  ).select("-password");

  if (!therapist) {
    return res.status(404).json({ message: "Therapist not found." });
  }

  res.json({ therapist, message: "Therapist verified successfully." });
};

export const rejectTherapist = async (req: Request, res: Response) => {
  const therapist = await Therapist.findByIdAndUpdate(
    req.params.therapistId,
    { isVerified: false, verificationStatus: "rejected" },
    { new: true },
  ).select("-password");

  if (!therapist) {
    return res.status(404).json({ message: "Therapist not found." });
  }

  res.json({ therapist, message: "Therapist rejected." });
};
