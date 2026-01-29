import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import Parser from "rss-parser";

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "NEON_SECRET_KEY";
const PORT = 3000;

const DB = () => JSON.parse(fs.readFileSync("db.json", "utf-8"));
const saveDB = (data) => fs.writeFileSync("db.json", JSON.stringify(data, null, 2));

const rssParser = new Parser({ timeout: 8000 });

app.get("/", (req, res) => res.send("Neon Gaming Hub API OK ✅ Használd: /api/..."));

/* ===== AUTH MIDDLEWARE ===== */
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden (admin only)" });
  next();
}

/* ===== AUTH ===== */
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim()) return res.status(400).json({ error: "Missing fields" });

  const db = DB();
  if (db.users.find((u) => u.email === email)) return res.status(409).json({ error: "User exists" });

  db.users.push({ email, password: bcrypt.hashSync(password, 10), role: "user" });
  saveDB(db);

  res.json({ success: true });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = DB();
  const u = db.users.find((x) => x.email === email);

  if (!u || !bcrypt.compareSync(password, u.password)) {
    return res.status(401).json({ error: "Invalid login" });
  }

  const token = jwt.sign({ email: u.email, role: u.role }, SECRET, { expiresIn: "2h" });
  res.json({ token });
});

/* ===== GAMES (FreeToGame) ===== */
app.get("/api/games", async (req, res) => {
  const r = await fetch("https://www.freetogame.com/api/games?platform=pc");
  res.json(await r.json());
});

app.get("/api/games/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const r = await fetch(`https://www.freetogame.com/api/game?id=${id}`);
  if (!r.ok) return res.status(404).json({ error: "Game not found" });
  res.json(await r.json());
});

/* ===== NEWS ===== */
app.get("/api/news", (req, res) => res.json(DB().news || []));

// Friss hírek több forrásból (RSS). Ha valamelyik forrás down, a többi attól még jön.
app.get("/api/news/aggregate", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 60) || 60, 150);

  // RSS feedek (gyakori, stabil gaming híroldalak)
  const feeds = [
    { source: "IGN", url: "https://feeds.feedburner.com/ign/all" },
    { source: "PC Gamer", url: "https://www.pcgamer.com/rss/" },
    { source: "GamesRadar", url: "https://www.gamesradar.com/rss/" },
    { source: "Rock Paper Shotgun", url: "https://www.rockpapershotgun.com/feed" },
    { source: "Polygon", url: "https://www.polygon.com/rss/index.xml" }
  ];

  const results = await Promise.allSettled(
    feeds.map(async (f) => {
      const parsed = await rssParser.parseURL(f.url);
      const items = (parsed.items || []).map((it) => ({
        title: it.title || "(cím nélkül)",
        url: it.link || it.guid,
        source: f.source,
        publishedAt: it.isoDate || it.pubDate || null
      }));
      return items;
    })
  );

  let merged = [];
  for (const r of results) {
    if (r.status === "fulfilled") merged = merged.concat(r.value);
  }

  // ha az RSS-ek nem jönnek, essünk vissza a db.json hírekre
  if (merged.length === 0) merged = (DB().news || []).map((n) => ({ ...n, publishedAt: null }));

  // duplikációk kiszűrése URL alapján
  const seen = new Set();
  merged = merged.filter((n) => {
    if (!n.url) return false;
    if (seen.has(n.url)) return false;
    seen.add(n.url);
    return true;
  });

  // dátum szerinti rendezés (ha nincs dátum, megy a végére)
  merged.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  res.json(merged.slice(0, limit));
});

/* ===== GOTY ===== */
app.get("/api/goty", (req, res) => {
  const goty = DB().goty || [];
  // Pontosan 10 év
  res.json(goty.slice(-10));
});

app.post("/api/goty", auth, adminOnly, (req, res) => {
  const { year, game, url } = req.body;
  if (!year || !game || !url) return res.status(400).json({ error: "Missing fields" });

  const db = DB();
  db.goty = db.goty || [];
  db.goty.push({ year, game, url });
  saveDB(db);

  res.json({ success: true });
});

/* ===== WEEKLY TOPICS ===== */
app.get("/api/weekly-topics/current", (req, res) => {
  const db = DB();
  const list = db.weeklyTopics || [];
  if (list.length === 0) {
    return res.json({
      weekStart: null,
      topics: ["Nincs beállítva heti téma."],
      activeTopic: "Nincs beállítva heti téma."
    });
  }
  res.json(list[list.length - 1]);
});

app.post("/api/weekly-topics", auth, adminOnly, (req, res) => {
  const { weekStart, topics, activeTopic } = req.body;
  if (!weekStart || !Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({ error: "Missing weekStart or topics[]" });
  }

  const db = DB();
  db.weeklyTopics = db.weeklyTopics || [];
  db.weeklyTopics.push({
    weekStart,
    topics,
    activeTopic: activeTopic || topics[0]
  });
  saveDB(db);

  res.json({ success: true });
});

/* ===== MESSAGES ===== */
app.get("/api/messages", (req, res) => {
  const db = DB();
  res.json(db.messages || []);
});

app.post("/api/messages", auth, (req, res) => {
  const { text, topic } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Message is empty" });

  const db = DB();
  db.messages = db.messages || [];
  db.messages.push({
    user: req.user.email,
    topic: topic || null,
    text,
    createdAt: new Date().toISOString()
  });
  saveDB(db);

  res.json({ success: true });
});

// admin törlés index alapján (egyszerű, beadáshoz jó)
app.delete("/api/messages/:index", auth, adminOnly, (req, res) => {
  const idx = Number(req.params.index);
  const db = DB();
  db.messages = db.messages || [];

  if (Number.isNaN(idx) || idx < 0 || idx >= db.messages.length) {
    return res.status(404).json({ error: "Message not found" });
  }

  db.messages.splice(idx, 1);
  saveDB(db);

  res.json({ success: true });
});

/* ===== SUPPORT / CONTACT ===== */
app.post("/api/support", (req, res) => {
  const { name, email, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const db = DB();
  db.support = db.support || [];
  db.support.push({ name, email, message, createdAt: new Date().toISOString() });
  saveDB(db);

  res.json({ success: true, reply: "Köszi! Megkaptuk az üzeneted." });
});

/* ===== DONATE (opcionális) ===== */
app.post("/api/donate", (req, res) => {
  const { name, amount } = req.body;
  if (!name?.trim() || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "Invalid donation" });
  }

  const db = DB();
  db.donations = db.donations || [];
  db.donations.push({ name, amount: Number(amount), createdAt: new Date().toISOString() });
  saveDB(db);

  res.json({ success: true, reply: `Köszi ${name}! Támogatás rögzítve: ${amount} Ft` });
});

app.listen(PORT, () => console.log(`🔥 API fut: http://localhost:${PORT}`));
