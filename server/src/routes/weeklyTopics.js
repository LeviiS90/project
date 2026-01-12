/**
 * Weekly topics:
 * - GET /api/weekly-topics/current
 * - POST /api/weekly-topics (admin)
 */
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export function weeklyTopicsRoutes(db) {
  const r = Router();

  r.get("/current", async (req, res) => {
    const row = await db.get("SELECT * FROM weekly_topics ORDER BY week_start DESC LIMIT 1");
    res.json(row);
  });

  const schema = z.object({
    topic: z.string().min(3),
    week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  });

  r.post("/", requireAuth, requireAdmin, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Validation error" });

    await db.run("INSERT INTO weekly_topics (topic, week_start) VALUES (?, ?)", [
      parsed.data.topic,
      parsed.data.week_start
    ]);
    res.json({ ok: true });
  });

  return r;
}
