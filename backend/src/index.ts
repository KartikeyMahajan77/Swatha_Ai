import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { serve } from "inngest/express";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import moodRouter from "./routes/mood";
import activityRouter from "./routes/activity";
import therapistRouter from "./routes/therapist";
import therapistsRouter from "./routes/therapists";
import adminRouter from "./routes/admin";
import appointmentRouter from "./routes/appointments";
import { protectTherapist } from "./middleware/auth";
import { startTherapySession } from "./controllers/appointmentController";
import { connectDB } from "./utils/db";
import { inngest } from "./inngest/client";
import { functions as inngestFunctions } from "./inngest/functions";
import { setupTherapySocket } from "./socket/therapySocket";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
setupTherapySocket(server);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev"));

// Set up Inngest endpoint
app.use(
  "/api/inngest",
  serve({ client: inngest, functions: inngestFunctions }),
);
// OnaF6EGHhgYY9OPv

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});
console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);

app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.post(
  "/therapist/appointments/:appointmentId/start-session",
  protectTherapist,
  (req, _res, next) => {
    req.appointmentActor = {
      _id: req.user._id,
      role: "therapist",
      name: req.user.name,
      email: req.user.email,
    };
    next();
  },
  startTherapySession,
);
app.use("/therapist", therapistRouter);
app.use("/therapists", therapistsRouter);
app.use("/admin", adminRouter);
app.use("/appointments", appointmentRouter);
app.use("/api/mood", moodRouter);
app.use("/api/activity", activityRouter);

// Error handling middleware
app.use(errorHandler);

const printRoutes = () => {
  const routes: string[] = [];
  const stack = (app as any)._router?.stack || [];

  stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods)
        .map((method) => method.toUpperCase())
        .join(",");
      routes.push(`${methods} ${middleware.route.path}`);
      return;
    }

    if (middleware.name === "router" && middleware.handle?.stack) {
      const basePath =
        middleware.regexp?.source
          ?.match(/^\^?\\\/([^\\]+)/)?.[1]
          ?.replace(/\\\//g, "/") || "";

      middleware.handle.stack.forEach((handler: any) => {
        if (!handler.route) {
          return;
        }

        const methods = Object.keys(handler.route.methods)
          .map((method) => method.toUpperCase())
          .join(",");
        routes.push(
          `${methods} /${[basePath, handler.route.path.replace(/^\//, "")]
            .filter(Boolean)
            .join("/")}`,
        );
      });
    }
  });

  logger.info(`Registered routes:\n${routes.sort().join("\n")}`);
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      printRoutes();
      logger.info(
        `Inngest endpoint available at http://localhost:${PORT}/api/inngest`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
