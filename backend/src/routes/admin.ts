import { Router } from "express";
import {
  adminLogin,
  adminRegister,
  getAdminDashboard,
  getAllTherapistsForAdmin,
  getPendingTherapists,
  rejectTherapist,
  verifyTherapist,
} from "../controllers/adminController";
import { protectAdmin } from "../middleware/auth";

const router = Router();

router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.get("/dashboard", protectAdmin, getAdminDashboard);
router.get("/therapists", protectAdmin, getAllTherapistsForAdmin);
router.get("/therapists/pending", protectAdmin, getPendingTherapists);
router.patch("/therapists/:therapistId/verify", protectAdmin, verifyTherapist);
router.patch("/therapists/:therapistId/reject", protectAdmin, rejectTherapist);

export default router;
