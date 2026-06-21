import mongoose, { Document, Schema } from "mongoose";

export interface ITherapyMessage extends Document {
  appointmentId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: "patient" | "therapist";
  message: string;
  timestamp: Date;
}

const TherapyMessageSchema = new Schema<ITherapyMessage>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: {
      type: String,
      enum: ["patient", "therapist"],
      required: true,
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const TherapyMessage = mongoose.model<ITherapyMessage>(
  "TherapyMessage",
  TherapyMessageSchema,
);
