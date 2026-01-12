/**
 * POST /api/donate (demo)
 */
import { Router } from "express";
import { z } from "zod";

export function donateRoutes(db) {
  const r = Router();

  const schema = z.object({
    email: z.string().email().optional(),
    amount: z.number().int().min(100),
    currency: z.string().min(3).max(3).default("HUF")
  });

  r.post("/", async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Validation error" });

    const { email, amount, currency } = parsed.data;
    await db.run("INSERT INTO donations (email, amount, currency) VALUES (?, ?, ?)", [
      email ?? null,
      amount,
      currency
    ]);

    res.json({ ok: true, message: "Köszi a támogatást! (Demo mentés kész)" });
  });

  return r;
}
