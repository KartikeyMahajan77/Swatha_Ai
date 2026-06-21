import { Request, Response } from "express";
import Groq from "groq-sdk";
import { Appointment } from "../models/Appointment";
import { TherapyMessage } from "../models/TherapyMessage";
import { User } from "../models/User";
import {
  canStartAppointment,
  normalizeAppointmentTimes,
} from "../utils/appointmentTime";
import { getTherapyIo } from "../socket/therapySocket";

const fallbackSummary = (reason: string) => ({
  sessionSummary: `Session completed successfully. AI summary could not be generated. Reason: ${reason}`,
  mainConcerns: [],
  emotionalState: "neutral",
  suggestedExercises: [],
  followUpRecommendation: "Therapist may add notes manually.",
  riskLevel: 0,
  therapistNotesDraft: "AI summary unavailable.",
});

const getAuthorizedAppointment = async (req: Request) => {
  const appointment = await Appointment.findById(req.params.appointmentId)
    .populate("patientId", "name email")
    .populate("therapistId", "name email specialization qualification hourlyRate");

  if (!appointment || !req.appointmentActor) {
    return null;
  }

  await normalizeAppointmentTimes(appointment);

  const actorId = req.appointmentActor._id.toString();
  const patientId = (appointment.patientId as any)._id
    ? (appointment.patientId as any)._id.toString()
    : appointment.patientId.toString();
  const therapistId = (appointment.therapistId as any)._id
    ? (appointment.therapistId as any)._id.toString()
    : appointment.therapistId.toString();

  if (
    (req.appointmentActor.role === "patient" && actorId !== patientId) ||
    (req.appointmentActor.role === "therapist" && actorId !== therapistId)
  ) {
    return null;
  }

  return appointment;
};

const publicAppointment = (appointment: any, actorRole?: string) => {
  const data = appointment.toObject ? appointment.toObject() : appointment;

  if (actorRole === "patient" && data.aiSummary?.therapistNotesDraft) {
    data.aiSummary = { ...data.aiSummary };
    delete data.aiSummary.therapistNotesDraft;
  }

  return data;
};

const parseGroqSummary = (content: string) => {
  const cleaned = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);

  return {
    sessionSummary:
      parsed.sessionSummary || "Session completed successfully.",
    mainConcerns: Array.isArray(parsed.mainConcerns) ? parsed.mainConcerns : [],
    emotionalState: parsed.emotionalState || "neutral",
    suggestedExercises: Array.isArray(parsed.suggestedExercises)
      ? parsed.suggestedExercises
      : [],
    therapistNotesDraft: parsed.therapistNotesDraft || "",
    followUpRecommendation: parsed.followUpRecommendation || "",
    riskLevel: Number(parsed.riskLevel || 0),
  };
};

const generateTherapySummary = async (messages: any[], appointment: any) => {
  try {
    console.log("Generating therapy summary", {
      appointmentId: appointment._id?.toString(),
      messageCount: messages.length,
      groqKeyLoaded: Boolean(process.env.GROQ_API_KEY),
    });

    if (!messages.length) {
      console.warn("AI summary fallback: no therapy messages found", {
        appointmentId: appointment._id?.toString(),
      });
      return fallbackSummary("No therapy messages were saved.");
    }

    if (!process.env.GROQ_API_KEY) {
      console.warn("AI summary fallback: GROQ_API_KEY missing");
      return fallbackSummary("GROQ_API_KEY is missing.");
    }

    const transcript = messages
      .map(
        (item) =>
          `${item.senderRole === "patient" ? "Patient" : "Therapist"}: ${item.message}`,
      )
      .join("\n");

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            'Return ONLY valid JSON with this shape: {"sessionSummary":"short summary of what was discussed","mainConcerns":["concern 1","concern 2"],"emotionalState":"anxious | sad | stressed | neutral | hopeful | mixed","suggestedExercises":["exercise 1","exercise 2"],"followUpRecommendation":"short follow up recommendation","riskLevel":0,"therapistNotesDraft":"private draft note for therapist"}. Safety: Do not diagnose. Do not claim certainty. Keep summary professional and supportive. If self-harm risk appears, riskLevel should be high and recommendation should suggest immediate support.',
        },
        {
          role: "user",
          content: `Appointment: ${appointment._id}\nTranscript:\n${transcript}`,
        },
      ],
      temperature: 0.2,
    });

    const rawSummary = result.choices[0]?.message?.content || "";
    console.log("Groq summary raw response", {
      appointmentId: appointment._id?.toString(),
      responseLength: rawSummary.length,
    });

    try {
      return parseGroqSummary(rawSummary);
    } catch (parseError) {
      console.warn("AI summary JSON parse failed", {
        appointmentId: appointment._id?.toString(),
        error: parseError instanceof Error ? parseError.message : parseError,
        rawSummary,
      });

      return {
        ...fallbackSummary("Groq returned invalid JSON."),
        sessionSummary:
          rawSummary ||
          "Session completed successfully. AI summary could not be generated.",
        therapistNotesDraft: rawSummary || "AI summary unavailable.",
      };
    }
  } catch (error) {
    console.warn("AI summary Groq request failed", {
      appointmentId: appointment._id?.toString(),
      error: error instanceof Error ? error.message : error,
    });
    return fallbackSummary(
      error instanceof Error ? error.message : "Groq request failed.",
    );
  }
};

export const getAppointment = async (req: Request, res: Response) => {
  const appointment = await getAuthorizedAppointment(req);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  res.json({
    appointment: publicAppointment(appointment, req.appointmentActor?.role),
    canStart: canStartAppointment(appointment.startTime),
  });
  console.log("Appointment:", appointment);
};

export const startAppointmentChat = async (req: Request, res: Response) => {
  const appointment = await getAuthorizedAppointment(req);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (appointment.status === "completed" || appointment.status === "cancelled") {
    return res.status(400).json({ message: "Appointment is not available for chat." });
  }

  if (!canStartAppointment(appointment.startTime)) {
    return res.status(403).json({
      message: `Chat will be available when your session starts at ${
        appointment.startTime
          ? appointment.startTime.toISOString()
          : "the scheduled time"
      }.`,
    });
  }

  if (req.appointmentActor?.role === "therapist") {
    return startTherapistSession(req, res);
  }

  return joinAppointmentSession(req, res);
};

export const startTherapistSession = async (req: Request, res: Response) => {
  console.log("start-session hit");
  console.log(req.params);
  console.log(req.user);

  const appointment = await getAuthorizedAppointment(req);
  if (!appointment || req.appointmentActor?.role !== "therapist") {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (!["booked", "waiting_for_patient"].includes(appointment.status)) {
    return res.status(400).json({ message: "Session cannot be started now." });
  }

  if (!canStartAppointment(appointment.startTime)) {
    return res.status(403).json({ message: "Session cannot start before scheduled time." });
  }

  appointment.status = "waiting_for_patient";
  appointment.therapistJoinedAt = appointment.therapistJoinedAt || new Date();
  appointment.chatStartedAt = appointment.chatStartedAt || new Date();
  await appointment.save();

  const patientId = (appointment.patientId as any)._id
    ? (appointment.patientId as any)._id.toString()
    : appointment.patientId.toString();
  const therapistId = (appointment.therapistId as any)._id
    ? (appointment.therapistId as any)._id.toString()
    : appointment.therapistId.toString();
  const therapistName = (appointment.therapistId as any).name || "Your therapist";
  const roomId = `appointment:${appointment._id}`;

  getTherapyIo()?.to(`user:${patientId}`).emit("therapy_session_started", {
    appointmentId: appointment._id,
    therapistId,
    therapistName,
    message: "Your therapist has started the session",
    status: "waiting_for_patient",
    roomId,
  });

  res.json({
    success: true,
    message: "Session started. Patient has been notified.",
    appointment: publicAppointment(appointment, req.appointmentActor?.role),
    roomId,
  });
};

export const startTherapySession = startTherapistSession;

export const joinAppointmentSession = async (req: Request, res: Response) => {
  const appointment = await getAuthorizedAppointment(req);
  if (!appointment || req.appointmentActor?.role !== "patient") {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (!["waiting_for_patient", "active"].includes(appointment.status)) {
    return res.status(400).json({ message: "Therapist has not started this session yet." });
  }

  appointment.patientJoinedAt = appointment.patientJoinedAt || new Date();
  appointment.status = "active";
  await appointment.save();

  getTherapyIo()?.to(`appointment:${appointment._id}`).emit("patient_joined_session", {
    appointmentId: appointment._id,
    patientId: req.appointmentActor._id,
    message: "Patient joined the session.",
  });

  res.json({
    success: true,
    appointment: publicAppointment(appointment, req.appointmentActor?.role),
    roomId: `appointment:${appointment._id}`,
  });
};

export const getAppointmentMessages = async (req: Request, res: Response) => {
  const appointment = await getAuthorizedAppointment(req);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  const messages = await TherapyMessage.find({
    appointmentId: appointment._id,
  }).sort({ timestamp: 1 });

  res.json({ messages });
};

export const postAppointmentMessage = async (req: Request, res: Response) => {
  const appointment = await getAuthorizedAppointment(req);
  if (!appointment || !req.appointmentActor) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (appointment.status !== "active") {
    return res.status(400).json({ message: "Chat is not active." });
  }

  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "Message is required." });
  }

  const savedMessage = await TherapyMessage.create({
    appointmentId: appointment._id,
    senderId: req.appointmentActor._id,
    senderRole: req.appointmentActor.role,
    message,
    timestamp: new Date(),
  });
  console.log("Therapy message saved via HTTP fallback", {
    appointmentId: appointment._id.toString(),
    senderRole: req.appointmentActor.role,
    messageId: savedMessage._id.toString(),
  });

  res.status(201).json({ message: savedMessage });
};

export const endAppointmentSession = async (req: Request, res: Response) => {
  const appointment = await getAuthorizedAppointment(req);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (req.appointmentActor?.role !== "therapist") {
    return res.status(403).json({ message: "Only the assigned therapist can end this session." });
  }

  if (appointment.status === "cancelled") {
    return res.status(400).json({ message: "Cancelled appointment cannot be completed." });
  }

  if (appointment.status !== "completed") {
    if (!["active", "waiting_for_patient"].includes(appointment.status)) {
      return res.status(400).json({ message: "Session is not active." });
    }

    const messages = await TherapyMessage.find({
      appointmentId: appointment._id,
    }).sort({ timestamp: 1 });
    console.log("Ending therapy session", {
      appointmentId: appointment._id.toString(),
      therapyMessageCount: messages.length,
      groqKeyLoaded: Boolean(process.env.GROQ_API_KEY),
    });

    appointment.status = "completed";
    appointment.chatEndedAt = new Date();
    appointment.aiSummary = await generateTherapySummary(messages, appointment);
    appointment.summaryGeneratedAt = new Date();
    await appointment.save();

    await User.updateOne(
      { _id: (appointment.patientId as any)._id || appointment.patientId },
      {
        $inc: { "therapyStats.completedSessions": 1 },
        $set: {
          "therapyStats.lastSessionAt": appointment.chatEndedAt,
          "therapyStats.currentMood": appointment.aiSummary.emotionalState,
          "therapyStats.moodScore": appointment.aiSummary.riskLevel,
        },
      },
    );
  }

  getTherapyIo()?.to(`appointment:${appointment._id}`).emit("end_therapy_session", {
    appointmentId: appointment._id,
  });

  res.json({
    success: true,
    appointment: publicAppointment(appointment, req.appointmentActor?.role),
    aiSummary: publicAppointment(appointment, req.appointmentActor?.role)
      .aiSummary,
  });
};
