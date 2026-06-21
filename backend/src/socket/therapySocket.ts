import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { Appointment } from "../models/Appointment";
import { TherapyMessage } from "../models/TherapyMessage";
import { Therapist } from "../models/Therapist";
import { User } from "../models/User";

let therapyIo: Server | null = null;

type SocketActor = {
  _id: any;
  role: "patient" | "therapist";
  name?: string;
};

const getSocketActor = async (token?: string): Promise<SocketActor | null> => {
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
  ) as any;

  if (decoded.userId) {
    const user = await User.findById(decoded.userId).select("name email");
    return user ? { _id: user._id, role: "patient", name: user.name } : null;
  }

  if (decoded.therapistId) {
    const therapist = await Therapist.findById(decoded.therapistId).select(
      "name email",
    );
    return therapist
      ? { _id: therapist._id, role: "therapist", name: therapist.name }
      : null;
  }

  return null;
};

const canAccessAppointment = async (
  appointmentId: string,
  actor: SocketActor,
) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return null;
  }

  const actorId = actor._id.toString();
  const ownsAppointment =
    (actor.role === "patient" &&
      appointment.patientId.toString() === actorId) ||
    (actor.role === "therapist" &&
      appointment.therapistId.toString() === actorId);

  return ownsAppointment ? appointment : null;
};

export const setupTherapySocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  therapyIo = io;

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");
      const actor = await getSocketActor(token);

      if (!actor) {
        return next(new Error("Unauthorized"));
      }

      socket.data.actor = actor;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_user_room", async ({ userId }, callback) => {
      const actor = socket.data.actor as SocketActor;

      if (actor.role !== "patient" || actor._id.toString() !== String(userId)) {
        callback?.({ success: false, message: "Unauthorized user room." });
        return;
      }

      socket.join(`user:${userId}`);
      callback?.({ success: true, roomId: `user:${userId}` });
    });

    socket.on("join_appointment_room", async ({ appointmentId }, callback) => {
      const actor = socket.data.actor as SocketActor;
      const appointment = await canAccessAppointment(appointmentId, actor);

      if (!appointment) {
        callback?.({ success: false, message: "Appointment not found." });
        return;
      }

      if (
        actor.role === "therapist" &&
        !["waiting_for_patient", "active"].includes(appointment.status)
      ) {
        callback?.({ success: false, message: "Appointment chat is not active." });
        return;
      }

      if (actor.role === "patient" && appointment.status !== "active") {
        callback?.({ success: false, message: "Appointment chat is not active." });
        return;
      }

      const roomId = `appointment:${appointmentId}`;
      socket.join(roomId);
      callback?.({ success: true, roomId });
    });

    socket.on("send_therapy_message", async ({ appointmentId, message }, callback) => {
      try {
        const actor = socket.data.actor as SocketActor;
        const appointment = await canAccessAppointment(appointmentId, actor);

        if (!appointment || appointment.status !== "active") {
          callback?.({ success: false, message: "Chat is not active." });
          return;
        }

        if (!message || typeof message !== "string") {
          callback?.({ success: false, message: "Message is required." });
          return;
        }

        const savedMessage = await TherapyMessage.create({
          appointmentId,
          senderId: actor._id,
          senderRole: actor.role,
          message,
          timestamp: new Date(),
        });
        console.log("Therapy message saved via socket", {
          appointmentId,
          senderRole: actor.role,
          messageId: savedMessage._id.toString(),
        });

        io.to(`appointment:${appointmentId}`).emit(
          "receive_therapy_message",
          savedMessage,
        );
        callback?.({ success: true, message: savedMessage });
      } catch (error) {
        callback?.({ success: false, message: "Failed to send message." });
      }
    });

    socket.on("typing", async ({ appointmentId }) => {
      socket.to(`appointment:${appointmentId}`).emit("typing", {
        appointmentId,
        senderRole: (socket.data.actor as SocketActor).role,
      });
    });

    socket.on("stop_typing", async ({ appointmentId }) => {
      socket.to(`appointment:${appointmentId}`).emit("stop_typing", {
        appointmentId,
        senderRole: (socket.data.actor as SocketActor).role,
      });
    });

    socket.on("end_therapy_session", async ({ appointmentId }) => {
      io.to(`appointment:${appointmentId}`).emit("end_therapy_session", {
        appointmentId,
      });
    });
  });

  return io;
};

export const getTherapyIo = () => therapyIo;
