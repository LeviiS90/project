/**
 * POST /api/auth/register
 * POST /api/auth/login
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

export function authRoutes(db) {
  const r = Router();

  const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string().min(6)
  });

  r.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation error", details: parsed.error.flatten() });
    }

    const { email, username, password } = parsed.data;
    const exists = await db.get("SELECT id FROM users WHERE email = ?", email);
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    await db.run(
      "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, 'user')",
      [email, username, hash]
    );

    res.json({ ok: true });
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  r.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Validation error" });

    const { email, password } = parsed.data;
    const user = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, username: user.username } });
  });

  return r;
}
