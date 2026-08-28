import { Request, Response } from "express";
import PlannerHistory, { IPlannerPlan } from "../models/PlannerHistory.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

const plannerSchema = {
  title: "string",
  summary: "string",
  bestTime: "string",
  estimatedBudget: "string",
  tips: ["string"],
  itinerary: [{ day: "number", title: "string", activities: ["string"] }],
};

const isTripPlan = (value: unknown): value is IPlannerPlan => {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  return (
    typeof plan.title === "string" &&
    typeof plan.summary === "string" &&
    typeof plan.bestTime === "string" &&
    typeof plan.estimatedBudget === "string" &&
    Array.isArray(plan.tips) && plan.tips.every((tip) => typeof tip === "string") &&
    Array.isArray(plan.itinerary) &&
    plan.itinerary.every((day) => {
      if (!day || typeof day !== "object") return false;
      const item = day as Record<string, unknown>;
      return typeof item.day === "number" && typeof item.title === "string" && Array.isArray(item.activities) && item.activities.every((activity) => typeof activity === "string");
    })
  );
};

export const planTrip = async (req: Request, res: Response): Promise<void> => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    res.status(400).json({ message: "Tell us where you want to go and what you enjoy." });
    return;
  }

  if (prompt.length > 4000) {
    res.status(400).json({ message: "Please keep your trip request under 4,000 characters." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(503).json({ message: "Trip planning is not configured yet. Add GROQ_API_KEY to the backend .env file." });
    return;
  }

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are Tripify's practical travel planner. Return only valid JSON matching this shape exactly: ${JSON.stringify(plannerSchema)}. Create a realistic, well-structured plan from the user's request. Do not invent bookings, live prices, opening hours, or guaranteed availability. Use concise activities and include 2-5 itinerary days when duration is known, otherwise provide 3 days. Mention when prices or details should be verified.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error("Groq planner error:", groqResponse.status, errorBody);
      res.status(502).json({ message: "The trip planner could not generate a plan right now. Please try again." });
      return;
    }

    const data = await groqResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      res.status(502).json({ message: "The trip planner returned an empty plan. Please try again." });
      return;
    }

    let plan: unknown;
    try {
      plan = JSON.parse(content);
    } catch {
      res.status(502).json({ message: "The trip planner returned an invalid plan. Please try again." });
      return;
    }

    if (!isTripPlan(plan)) {
      res.status(502).json({ message: "The trip planner returned an incomplete plan. Please try again." });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const history = await PlannerHistory.create({ user: req.user._id, prompt, plan });
    res.status(200).json({ ...plan, historyId: history._id, createdAt: history.createdAt });
  } catch (error) {
    console.error("Trip planner request failed:", error);
    res.status(502).json({ message: "The trip planner is temporarily unavailable. Please try again." });
  }
};

export const getPlannerHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const history = await PlannerHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("prompt plan createdAt");

    res.status(200).json(history);
  } catch (error) {
    console.error("Planner history request failed:", error);
    res.status(500).json({ message: "Could not load your planning history." });
  }
};