import { Router } from "express";

const BASE = "https://www.freetogame.com/api";

export function gamesRoutes() {
  const r = Router();

  r.get("/", async (req, res, next) => {
    try {
      const url = new URL(`${BASE}/games`);
      for (const [k, v] of Object.entries(req.query)) {
        if (typeof v === "string" && v.length) url.searchParams.set(k, v);
      }
      const resp = await fetch(url);
      if (!resp.ok) return res.status(502).json({ error: "Upstream API error" });
      const data = await resp.json();
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  r.get("/:id", async (req, res, next) => {
    try {
      const resp = await fetch(`${BASE}/game?id=${encodeURIComponent(req.params.id)}`);
      if (!resp.ok) return res.status(502).json({ error: "Upstream API error" });
      const data = await resp.json();
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
