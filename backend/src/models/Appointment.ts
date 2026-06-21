import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  therapistId: mongoose.Types.ObjectId;
  availabilitySlotId?: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  startTime?: Date;
  endTime?: Date;
  durationMinutes: number;
  hourlyRate: number;
  totalAmount: number;
  status: "booked" | "waiting_for_patient" | "active" | "completed" | "cancelled";
  notes?: string;
  therapistJoinedAt?: Date;
  patientJoinedAt?: Date;
  chatStartedAt?: Date;
  chatEndedAt?: Date;
  summaryGeneratedAt?: Date;
  aiSummary?: {
    sessionSummary: string;
    mainConcerns: string[];
    emotionalState?: string;
    suggestedExercises: string[];
    therapistNotesDraft?: string;
    followUpRecommendation?: string;
    riskLevel: number;
  };
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    availabilitySlotId: { type: Schema.Types.ObjectId },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    durationMinutes: { type: Number, required: true, min: 15 },
    hourlyRate: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["booked", "waiting_for_patient", "active", "completed", "cancelled"],
      default: "booked",
    },
    notes: { type: String },
    therapistJoinedAt: { type: Date },
    patientJoinedAt: { type: Date },
    chatStartedAt: { type: Date },
    chatEndedAt: { type: Date },
    summaryGeneratedAt: { type: Date },
    aiSummary: {
      sessionSummary: { type: String },
      mainConcerns: [{ type: String }],
      emotionalState: { type: String },
      suggestedExercises: [{ type: String }],
      therapistNotesDraft: { type: String },
      followUpRecommendation: { type: String },
      riskLevel: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  AppointmentSchema,
);
