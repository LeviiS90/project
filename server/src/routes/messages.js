/**
 * Üzenőfal:
 * - GET /api/messages -> topic + messages
 * - POST /api/messages -> 401, ha nincs token
 * - DELETE /api/messages/:id -> admin törölhet
 */
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export function messagesRoutes(db) {
  const r = Router();

  r.get("/", async (req, res) => {
    const topic = await db.get("SELECT * FROM weekly_topics ORDER BY week_start DESC LIMIT 1");
    const rows = await db.all(
      `SELECT m.id, m.content, m.created_at, u.username
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.topic_id = ?
       ORDER BY m.created_at DESC`,
      [topic.id]
    );
    res.json({ topic, messages: rows });
  });

  const schema = z.object({
    content: z.string().min(1).max(800)
  });

  r.post("/", requireAuth, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Validation error" });

    const topic = await db.get("SELECT * FROM weekly_topics ORDER BY week_start DESC LIMIT 1");
    await db.run(
      "INSERT INTO messages (user_id, topic_id, content) VALUES (?, ?, ?)",
      [req.user.id, topic.id, parsed.data.content]
    );

    res.json({ ok: true });
  });

  r.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
    await db.run("DELETE FROM messages WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  });

  return r;
}
