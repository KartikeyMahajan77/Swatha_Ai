import { Request, Response } from "express";
import { ChatSession, IChatSession } from "../models/ChatSession";
import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { inngest } from "../inngest/client";
import { User } from "../models/User";
import { InngestEvent } from "../types/inngest";
import { Types } from "mongoose";

// Create a new chat session
export const createChatSession = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      logger.warn("Unauthorized - no user in request");
      return res
        .status(401)
        .json({ error: "Unauthorized - User not authenticated" });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      logger.warn("User not found", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    const sessionId = uuidv4();

    const session = new ChatSession({
      sessionId,
      userId,
      startTime: new Date(),
      status: "active",
      messages: [],
    });

    await session.save();
    logger.info("Chat session created successfully", { sessionId, userId });

    res.status(201).json({
      success: true,
      message: "Chat session created successfully",
      sessionId: session.sessionId,
    });
  } catch (error) {
    logger.error("Error creating chat session:", error);
    res.status(500).json({
      error: "Error creating chat session",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all chat sessions for the authenticated user
export const getAllChatSessions = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      logger.warn("Unauthorized - no user in request");
      return res
        .status(401)
        .json({ error: "Unauthorized - User not authenticated" });
    }

    const sessions = await ChatSession.find({ userId: req.user._id })
      .sort({ startTime: -1 })
      .lean();

    res.json(
      sessions.map((session) => ({
        sessionId: session.sessionId,
        messages: session.messages || [],
        createdAt: session.startTime,
        updatedAt:
          session.messages?.[session.messages.length - 1]?.timestamp ||
          session.startTime,
        status: session.status,
      })),
    );
  } catch (error) {
    logger.error("Error fetching chat sessions:", error);
    res.status(500).json({
      error: "Error fetching chat sessions",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Send a message in the chat session
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      logger.warn("Invalid message format", { message });
      return res
        .status(400)
        .json({ error: "Message is required and must be a string" });
    }

    if (!req.user || !req.user._id) {
      logger.warn("Unauthorized - no user in request", { sessionId });
      return res
        .status(401)
        .json({ error: "Unauthorized - User not authenticated" });
    }

    const userId = req.user._id;
    logger.info("Processing chat message", {
      sessionId,
      userId,
      messageLength: message.length,
    });

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      logger.warn("Chat session not found", { sessionId });
      return res.status(404).json({ error: "Chat session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      logger.warn("Unauthorized access to chat session", {
        sessionId,
        userId,
        sessionUserId: session.userId,
      });
      return res
        .status(403)
        .json({ error: "Unauthorized - You do not own this chat session" });
    }

    if (!process.env.GROQ_API_KEY) {
      logger.error("GROQ_API_KEY is missing from .env file");
      return res.status(500).json({
        error: "AI service not configured. GROQ_API_KEY is missing.",
      });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    try {
      const event: InngestEvent = {
        name: "therapy/session.message",
        data: {
          message,
          history: session.messages,
          memory: {
            userProfile: {
              emotionalState: [],
              riskLevel: 0,
              preferences: {},
            },
            sessionContext: {
              conversationThemes: [],
              currentTechnique: null,
            },
          },
          goals: [],
          systemPrompt: `You are Swastha AI, a compassionate and professional mental health companion.`,
        },
      };

      try {
        await inngest.send(event);
        logger.debug("Inngest event sent successfully", { sessionId });
      } catch (inngestError) {
        logger.warn("Inngest event failed (non-critical)", {
          error: inngestError,
        });
      }
    } catch (eventError) {
      logger.error("Error preparing Inngest event", eventError);
    }

    const conversationHistory = session.messages
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Swastha AI"}: ${m.content}`)
      .join("\n");

    const crisisKeywords = [
      "suicide",
      "suicidal",
      "self-harm",
      "cut myself",
      "kill myself",
      "end it all",
      "overdose",
      "harm myself",
    ];

    const hasCrisisSignal = crisisKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword),
    );

    if (hasCrisisSignal) {
      const crisisResponse = `I can hear that you're going through something very difficult right now, and I'm genuinely concerned about your safety. Please contact local emergency services immediately or reach out to someone you trust right now. You deserve real support and care. If possible, please call a trusted friend, family member, therapist, or emergency helpline immediately.`;

      session.messages.push({
        role: "user",
        content: message,
        timestamp: new Date(),
      });

      session.messages.push({
        role: "assistant",
        content: crisisResponse,
        timestamp: new Date(),
        metadata: {
          analysis: {
            emotionalState: "crisis",
            riskLevel: 5,
            themes: ["safety concern"],
            recommendedApproach: "crisis intervention",
            progressIndicators: [],
          },
          progress: {
            emotionalState: "crisis",
            riskLevel: 5,
          },
        },
      });

      await session.save();

      return res.json({
        success: true,
        response: crisisResponse,
        message: crisisResponse,
        reply: crisisResponse,
        analysis: {
          emotionalState: "crisis",
          riskLevel: 5,
          themes: ["safety concern"],
          recommendedApproach: "crisis intervention",
          progressIndicators: [],
        },
        metadata: {
          progress: {
            emotionalState: "crisis",
            riskLevel: 5,
          },
        },
      });
    }

    const analysisPrompt = `Analyze this therapy message and return ONLY valid JSON.

Message: "${message}"
Previous conversation: ${conversationHistory || "None"}

Return this exact JSON structure:
{
  "emotionalState": "describe the user emotional state in 2-3 words",
  "themes": ["main theme 1", "main theme 2"],
  "riskLevel": 0,
  "recommendedApproach": "best therapeutic approach for this message",
  "progressIndicators": ["positive sign if any"]
}`;

    let analysis = {
      emotionalState: "neutral",
      themes: ["general support"],
      riskLevel: 0,
      recommendedApproach: "empathetic listening",
      progressIndicators: [] as string[],
    };

    try {
      const analysisResult = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
      });

      const analysisText =
        analysisResult.choices[0]?.message?.content?.trim() || "";

      const cleanAnalysisText = analysisText
        .replace(/```json\n?|\n?```/g, "")
        .trim();

      analysis = JSON.parse(cleanAnalysisText);
      logger.debug("Analysis completed", { analysis });
    } catch (analysisError) {
      logger.warn("Analysis parsing failed, using defaults", {
        error: analysisError,
      });
    }

    const responsePrompt = `
Previous conversation:
${conversationHistory || "No previous conversation."}

User message:
"${message}"

Emotional analysis:
${JSON.stringify(analysis)}

Generate one helpful reply for this user.

Avoid repeated template phrases.
Do not start with "It sounds like" unless truly needed.
Do not use bullet points unless giving a short exercise.
End with exactly one follow-up question.
`;

    let response: string;

    try {
      const responseResult = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: SWASTHA_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: responsePrompt,
          },
        ],
        temperature: 0.7,
      });

      response =
        responseResult.choices[0]?.message?.content?.trim() ||
        "I'm here to listen and support you. Could you tell me more about what you're feeling right now?";

      logger.debug("Response generated successfully", {
        responseLength: response.length,
      });
    } catch (responseError) {
      logger.error("Error generating response from Groq", responseError);
      return res.status(502).json({
        error:
          "AI service failed to generate a response. Please check GROQ_API_KEY and Groq API access.",
        details:
          responseError instanceof Error
            ? responseError.message
            : "Unknown Groq error",
      });
    }

    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    session.messages.push({
      role: "assistant",
      content: response,
      timestamp: new Date(),
      metadata: {
        analysis,
        progress: {
          emotionalState: analysis.emotionalState,
          riskLevel: analysis.riskLevel,
        },
      },
    });

    await session.save();

    logger.info("Messages saved to session", {
      sessionId,
      totalMessages: session.messages.length,
    });

    res.json({
      success: true,
      response,
      message: response,
      reply: response,
      analysis,
      metadata: {
        progress: {
          emotionalState: analysis.emotionalState,
          riskLevel: analysis.riskLevel,
        },
      },
    });
  } catch (error) {
    logger.error("Unexpected error in sendMessage", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      error: "Error processing message",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get chat session history
export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = new Types.ObjectId(req.user.id);

    const session = (await ChatSession.findOne({
      sessionId,
    }).exec()) as IChatSession;

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({
      messages: session.messages,
      startTime: session.startTime,
      status: session.status,
    });
  } catch (error) {
    logger.error("Error fetching session history:", error);
    res.status(500).json({ message: "Error fetching session history" });
  }
};

export const getChatSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    logger.info(`Getting chat session: ${sessionId}`);

    const chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    res.json(chatSession);
  } catch (error) {
    logger.error("Failed to get chat session:", error);
    res.status(500).json({ error: "Failed to get chat session" });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = new Types.ObjectId(req.user.id);

    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(session.messages);
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Error fetching chat history" });
  }
};
const SWASTHA_SYSTEM_PROMPT = `
You are Swastha AI, a private, non-judgmental mental wellness companion for people who may be afraid to express their feelings.

Your mission:
Help users safely express emotions like depression, anxiety, fear, stress, loneliness, guilt, anger, overthinking, exam pressure, family pressure, relationship pain, and hopelessness.

Important identity:
- You are NOT a licensed therapist.
- You do NOT diagnose.
- You do NOT give medical prescriptions.
- You provide emotional support, reflection, coping strategies, and encourage professional help when needed.

Conversation style:
- Sound human, warm, calm, and natural.
- Do not use the same opening repeatedly.
- Avoid generic lines like “It sounds like...” in every reply.
- Do not overuse “I’m here to listen.”
- Respond based on the user’s exact words.
- Use simple language.
- Keep replies between 70 and 140 words.
- Ask only ONE meaningful follow-up question at the end.
- Never judge the user.
- Make the user feel safe to share.

Response structure:
1. First, reflect the emotion specifically.
2. Then normalize the feeling without minimizing it.
3. Give one practical coping step.
4. End with one gentle follow-up question.

When user is anxious:
- Suggest grounding, slow breathing, breaking problem into small steps.

When user is depressed/sad:
- Validate pain, suggest tiny achievable action, encourage connection with trusted person.

When user has fear/tension:
- Help identify what is controllable and what is not.

When user says they cannot share with anyone:
- Reassure privacy and non-judgment.
- Encourage writing feelings here or talking to one trusted person.

Crisis safety:
If user mentions suicide, self-harm, ending life, overdose, or not wanting to live:
- Respond seriously and compassionately.
- Tell them they deserve immediate support.
- Ask them to contact local emergency services or a trusted person right now.
- Do not continue normal coaching.
`;
