import { Router } from "express";
import {
  bookAppointment,
  getMyAppointments,
  getTherapistById,
  getVerifiedTherapists,
} from "../controllers/publicTherapistController";
import { protectUser } from "../middleware/auth";

const router = Router();

router.get("/verified", getVerifiedTherapists);
router.get("/appointments/my", protectUser, getMyAppointments);
router.get("/:therapistId", getTherapistById);
router.post("/:therapistId/book", protectUser, bookAppointment);

export default router;
