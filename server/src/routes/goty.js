/**
 * GOTY:
 * - GET /api/goty -> mindig 10 év (aktuális év-9..aktuális év)
 * - POST /api/goty -> admin frissíti
 */
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export function gotyRoutes(db) {
  const r = Router();

  r.get("/", async (req, res) => {
    const year = new Date().getFullYear();
    const from = year - 9;

    const rows = await db.all(
      "SELECT * FROM goty WHERE year BETWEEN ? AND ? ORDER BY year DESC",
      [from, year]
    );

    const byYear = new Map(rows.map(x => [x.year, x]));
    const result = [];
    for (let y = year; y >= from; y--) {
      result.push(
        byYear.get(y) ?? {
          year: y,
          title: `GOTY ${y} (hiányzik)`,
          description: "Admin még nem állította be.",
          official_url: "https://example.com",
          image_url: ""
        }
      );
    }
    res.json(result);
  });

  const schema = z.object({
    year: z.number().int().min(2000).max(2100),
    title: z.string().min(1),
    description: z.string().min(1),
    official_url: z.string().url(),
    image_url: z.string().optional().default("")
  });

  r.post("/", requireAuth, requireAdmin, async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Validation error" });

    const { year, title, description, official_url, image_url } = parsed.data;

    await db.run(
      `INSERT INTO goty (year, title, description, official_url, image_url, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(year) DO UPDATE SET
         title=excluded.title,
         description=excluded.description,
         official_url=excluded.official_url,
         image_url=excluded.image_url,
         updated_at=datetime('now')`,
      [year, title, description, official_url, image_url ?? ""]
    );

    res.json({ ok: true });
  });

  return r;
}
