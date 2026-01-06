import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export async function initDb() {
  const db = await open({
    filename: "./cyberhub.sqlite",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS goty (
      year INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      official_url TEXT NOT NULL,
      image_url TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      week_start TEXT NOT NULL, -- ISO date
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(topic_id) REFERENCES weekly_topics(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS support_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'HUF',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await seedAdmin(db);

  await seedWeeklyTopic(db);

  await seedGoty(db);

  return db;
}

async function seedAdmin(db) {
  const email = process.env.ADMIN_SEED_EMAIL;
  const pass = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !pass) return;

  const existing = await db.get("SELECT id FROM users WHERE email = ?", email);
  if (existing) return;

  const hash = await bcrypt.hash(pass, 10);
  await db.run(
    "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, 'admin')",
    [email, "Admin", hash]
  );
}

async function seedWeeklyTopic(db) {
  const row = await db.get("SELECT id FROM weekly_topics ORDER BY week_start DESC LIMIT 1");
  if (row) return;

  const now = new Date();
  const monday = new Date(now);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  const iso = monday.toISOString().slice(0, 10);

  await db.run(
    "INSERT INTO weekly_topics (topic, week_start) VALUES (?, ?)",
    ["Melyik játék érdemel remake-et és miért?", iso]
  );
}

async function seedGoty(db) {
  const count = await db.get("SELECT COUNT(*) as c FROM goty");
  if (count?.c > 0) return;

  const year = new Date().getFullYear();
  for (let y = year - 9; y <= year; y++) {
    await db.run(
      `INSERT INTO goty (year, title, description, official_url, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        y,
        `GOTY ${y} (állítsd be)`,
        "Admin felülettel frissíthető: cím, leírás, hivatalos link, kép.",
        "https://example.com",
        ""
      ]
    );
  }
}
