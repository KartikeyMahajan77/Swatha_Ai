import { Router } from "express";
import {
  getTherapistAppointments,
  getTherapistProfile,
  therapistLogin,
  therapistRegister,
  updateTherapistAvailability,
  updateTherapistProfile,
} from "../controllers/therapistController";
import { protectTherapist } from "../middleware/auth";
import {
  endAppointmentSession,
  startTherapySession,
  startTherapistSession,
} from "../controllers/appointmentController";
import { protectAppointmentParticipant } from "../middleware/appointmentAuth";
import { Request, Response, NextFunction } from "express";

const router = Router();

const setTherapistAppointmentActor = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.appointmentActor = {
    _id: req.user._id,
    role: "therapist",
    name: req.user.name,
    email: req.user.email,
  };
  next();
};

router.post("/register", therapistRegister);
router.post("/login", therapistLogin);
router.get("/profile", protectTherapist, getTherapistProfile);
router.patch("/profile", protectTherapist, updateTherapistProfile);
router.get("/appointments", protectTherapist, getTherapistAppointments);
router.post(
  "/appointments/:appointmentId/start-session",
  protectTherapist,
  setTherapistAppointmentActor,
  startTherapySession,
);
router.post(
  "/appointments/:appointmentId/end-session",
  protectAppointmentParticipant,
  endAppointmentSession,
);
router.patch("/availability", protectTherapist, updateTherapistAvailability);

export default router;
