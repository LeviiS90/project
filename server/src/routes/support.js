/**
 * POST /api/support
 */
import { Router } from "express";
import { z } from "zod";

export function supportRoutes(db) {
  const r = Router();

  const schema = z.object({
    email: z.string().email(),
    subject: z.string().min(3),
    message: z.string().min(10)
  });

  r.post("/", async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Validation error" });

    await db.run(
      "INSERT INTO support_requests (email, subject, message) VALUES (?, ?, ?)",
      [parsed.data.email, parsed.data.subject, parsed.data.message]
    );

    res.json({ ok: true, message: "Köszönjük! A support üzenetedet megkaptuk." });
  });

  return r;
}
