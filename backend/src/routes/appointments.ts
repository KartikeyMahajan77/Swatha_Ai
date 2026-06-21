import { Router } from "express";
import {
  endAppointmentSession,
  getAppointment,
  getAppointmentMessages,
  joinAppointmentSession,
  postAppointmentMessage,
  startAppointmentChat,
} from "../controllers/appointmentController";
import { protectAppointmentParticipant } from "../middleware/appointmentAuth";

const router = Router();

router.get("/:appointmentId", protectAppointmentParticipant, getAppointment);
router.post(
  "/:appointmentId/start-chat",
  protectAppointmentParticipant,
  startAppointmentChat,
);
router.post(
  "/:appointmentId/join-session",
  protectAppointmentParticipant,
  joinAppointmentSession,
);
router.get(
  "/:appointmentId/messages",
  protectAppointmentParticipant,
  getAppointmentMessages,
);
router.post(
  "/:appointmentId/messages",
  protectAppointmentParticipant,
  postAppointmentMessage,
);
router.post(
  "/:appointmentId/end-session",
  protectAppointmentParticipant,
  endAppointmentSession,
);

export default router;
