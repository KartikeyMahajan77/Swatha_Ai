import mongoose, { Document, Schema } from "mongoose";

export interface IAvailabilitySlot {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface ITherapist extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  hourlyRate: number;
  bio: string;
  certificateUrl?: string;
  isVerified: boolean;
  verificationStatus: "pending" | "verified" | "rejected";
  role: "therapist";
  availability: IAvailabilitySlot[];
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const TherapistSchema = new Schema<ITherapist>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    experienceYears: { type: Number, required: true, min: 0 },
    hourlyRate: { type: Number, required: true, min: 0 },
    bio: { type: String, required: true },
    certificateUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    role: { type: String, default: "therapist" },
    availability: { type: [AvailabilitySlotSchema], default: [] },
  },
  { timestamps: true },
);

export const Therapist = mongoose.model<ITherapist>(
  "Therapist",
  TherapistSchema,
);
