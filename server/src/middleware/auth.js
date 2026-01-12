/**
 * Auth middleware:
 * - requireAuth: JWT token kell (különben 401)
 * - requireAdmin: admin role kell (különben 403)
 */
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Unauthorized (no token)" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, username }
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized (invalid token)" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden (admin only)" });
  }
  next();
}
