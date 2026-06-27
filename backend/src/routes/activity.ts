import express from "express";
import { auth } from "../middleware/auth";
import { logActivity, getTodaysActivities } from "../controllers/activityController";

const router = express.Router();

// All routes are protected with authentication
router.use(auth);

router.get("/today", getTodaysActivities);

// Log a new activity
router.post("/", logActivity);

export default router;
