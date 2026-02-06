/**
 * Neon GameHub — Express REST API + statikus React(JSX) kliens.
 * ------------------------------------------------------------
 * Split verzió (17 fájl összesen).
 * - React a böngészőben Babel-lel (build nélkül)
 * - Express REST API (auth, goty, messages, weekly topic, games proxy, news RSS aggregator)
 *
 * Megjegyzés: Az adatok MEMÓRIÁBAN vannak (restart után törlődnek).
 */

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import RSSParser from "rss-parser";
import Stripe from "stripe";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- Statikus kliens (public) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// --- Konfig ---
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// --- Stripe (Checkout) ---
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || "eur";
const STRIPE_AMOUNT_CENTS = Number(process.env.STRIPE_AMOUNT_CENTS || 499); // 4.99 EUR default (test)
const STRIPE_PRODUCT_NAME = process.env.STRIPE_PRODUCT_NAME || "Neon GameHub hozzáférés";
const STRIPE_BASE_URL = process.env.STRIPE_BASE_URL || ""; // pl. https://example.com


// --- In-memory "DB" ---
const db = {
  users: [],
  messages: [],
  weeklyTopic: null,
  goty: [],
  pendingUsers: [] // { id, name, email, passwordHash, createdAt }
};

// --- Seed: admin + weekly topic + 10 év GOTY placeholder ---
(function seed() {
  const adminPass = "admin123";
  const passwordHash = bcrypt.hashSync(adminPass, 10);
  db.users.push({ id: 1, username: "admin", name: "Admin", email: null, passwordHash, role: "admin", active: true });

  const monday = getMondayISO(new Date());
  db.weeklyTopic = { id: 1, title: "Mi volt a legjobb boss fight élményed?", weekStartISO: monday };

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 9; y--) {
    db.goty.push({
      year: y,
      title: `GOTY ${y} (szerkeszthető)`,
      description: "Admin tudja frissíteni ezt az évet a GOTY oldalon.",
      url: "https://www.thegameawards.com/",
      cover: ""
    });
  }
})();

// --- Helpers ---
function getMondayISO(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username || null,
      email: user.email || null,
      name: user.name || null,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function requireAuth(requiredRole = null) {
  return (req, res, next) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized: missing token" });

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: "Forbidden: insufficient role" });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Unauthorized: invalid/expired token" });
    }
  };
}

// --- AUTH + fizetés (Stripe Checkout) ---
function getBaseUrl(req) {
  if (STRIPE_BASE_URL) return STRIPE_BASE_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").toString();
  const host = req.headers.host;
  return `${proto}://${host}`;
}

function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  const nm = String(name || "").trim();
  const em = String(email || "").trim().toLowerCase();
  const pw = String(password || "");

  if (!nm || !em || !pw) return res.status(400).json({ error: "name, email, password are required." });
  if (!/^\S+@\S+\.\S+$/.test(em)) return res.status(400).json({ error: "Invalid email address." });
  if (pw.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

  const exists =
    db.users.some(u => (u.email || "").toLowerCase() === em) ||
    db.pendingUsers.some(u => u.email === em);
  if (exists) return res.status(409).json({ error: "Email already registered." });

  const stripe = getStripe();
  if (!stripe) {
    return res.status(500).json({ error: "Stripe nincs beállítva. Add meg a STRIPE_SECRET_KEY-t a .env-ben." });
  }

  const id = db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  const passwordHash = bcrypt.hashSync(pw, 10);

  const pending = { id, name: nm, email: em, passwordHash, createdAt: Date.now() };
  db.pendingUsers.push(pending);

  try {
    const base = getBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: em,
      line_items: [
        {
          price_data: {
            currency: STRIPE_CURRENCY,
            product_data: { name: STRIPE_PRODUCT_NAME },
            unit_amount: STRIPE_AMOUNT_CENTS
          },
          quantity: 1
        }
      ],
      metadata: {
        pendingUserId: String(id),
        email: em
      },
      success_url: `${base}/#/register-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#/register-cancel`
    });

    return res.json({ ok: true, checkoutUrl: session.url });
  } catch (e) {
    db.pendingUsers = db.pendingUsers.filter(u => u.id !== id);
    return res.status(500).json({ error: "Stripe Checkout létrehozása sikertelen.", details: e?.message || String(e) });
  }
});

app.get("/api/auth/confirm", async (req, res) => {
  const sessionId = String(req.query.session_id || "").trim();
  if (!sessionId) return res.status(400).json({ error: "session_id is required." });

  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe nincs beállítva (STRIPE_SECRET_KEY)." });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed.", payment_status: session.payment_status });
    }

    const pendingUserId = Number(session.metadata?.pendingUserId || 0);
    const pending = db.pendingUsers.find(u => u.id === pendingUserId);

    if (!pending) {
      const em = String(session.customer_details?.email || session.customer_email || "").toLowerCase();
      const maybe = db.users.find(u => (u.email || "").toLowerCase() === em);
      if (maybe && maybe.active) {
        return res.json({ ok: true, alreadyActive: true, user: { id: maybe.id, email: maybe.email, name: maybe.name, role: maybe.role } });
      }
      return res.status(404).json({ error: "Pending user not found (server újraindult?)" });
    }

    const user = {
      id: pending.id,
      username: pending.email,
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      role: "user",
      active: true
    };
    db.users.push(user);
    db.pendingUsers = db.pendingUsers.filter(u => u.id !== pending.id);

    return res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    return res.status(500).json({ error: "Stripe confirm sikertelen.", details: e?.message || String(e) });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, username, password } = req.body || {};
  const identifier = String(email || username || "").trim().toLowerCase();
  if (!identifier || !password) return res.status(400).json({ error: "email/username and password are required." });

  let user = db.users.find(u => (u.email || "").toLowerCase() === identifier);
  if (!user) user = db.users.find(u => (u.username || "").toLowerCase() === identifier);
  if (!user) return res.status(401).json({ error: "Invalid credentials." });

  if (user.role !== "admin" && !user.active) {
    return res.status(403).json({ error: "Account not active. Complete payment first." });
  }

  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials." });

  const token = signToken(user);
  return res.json({
    ok: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role }
  });
});

// --- GAMES (FreeToGame proxy) ---
app.get("/api/games", async (req, res) => {
  try {
    const url = new URL("https://www.freetogame.com/api/games");
    const allowed = ["platform", "category", "sort-by"];
    for (const k of allowed) if (req.query[k]) url.searchParams.set(k, req.query[k]);
    const r = await fetch(url.toString());
    if (!r.ok) return res.status(502).json({ error: "Upstream games API error." });
    const data = await r.json();
    return res.json(data);
  } catch {
    return res.status(500).json({ error: "Server error fetching games." });
  }
});

app.get("/api/games/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const url = `https://www.freetogame.com/api/game?id=${encodeURIComponent(id)}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(404).json({ error: "Game not found." });
    const data = await r.json();
    return res.json(data);
  } catch {
    return res.status(500).json({ error: "Server error fetching game details." });
  }
});

// --- GOTY ---
app.get("/api/goty", (req, res) => {
  const currentYear = new Date().getFullYear();
  const out = [];
  for (let y = currentYear; y >= currentYear - 9; y--) {
    const entry = db.goty.find(g => g.year === y);
    if (entry) out.push({ ...entry, isDefault: false });
    else out.push({ year: y, title: `GOTY ${y}`, description: "Nincs adat.", url: "", cover: "", isDefault: true });
  }
  return res.json(out);
});

app.post("/api/goty", requireAuth("admin"), (req, res) => {
  const { year, title, description, url, cover } = req.body || {};
  if (!year || !title) return res.status(400).json({ error: "year and title are required." });

  const y = Number(year);
  const idx = db.goty.findIndex(g => g.year === y);
  const rec = { year: y, title, description: description || "", url: url || "", cover: cover || "" };
  if (idx >= 0) db.goty[idx] = rec;
  else db.goty.push(rec);
  return res.json({ ok: true, goty: rec });
});



/**
 * DELETE /api/goty/:year
 * Admin-only: GOTY rekord törlése egy évhez.
 * A /api/goty ezután automatikusan visszaadja a "GOTY {év}" placeholdert.
 */
app.delete("/api/goty/:year", requireAuth("admin"), (req, res) => {
  const y = Number(req.params.year);
  if (!y) return res.status(400).json({ error: "year param is required." });
  const before = db.goty.length;
  db.goty = db.goty.filter(g => g.year !== y);
  const removed = before !== db.goty.length;
  return res.json({ ok: true, removed, year: y });
});

// --- MESSAGES ---
app.get("/api/messages", (req, res) => {
  const list = [...db.messages].sort((a, b) => b.createdAt - a.createdAt);
  return res.json(list);
});

app.post("/api/messages", requireAuth(), (req, res) => {
  const { text } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: "text is required." });

  const id = db.messages.length ? Math.max(...db.messages.map(m => m.id)) + 1 : 1;
  const topic = db.weeklyTopic;
  const msg = {
    id,
    userId: req.user.sub,
    username: req.user.username,
    topicId: topic?.id ?? 1,
    topicTitle: topic?.title ?? "Aktuális téma",
    text: String(text).slice(0, 800),
    createdAt: Date.now()
  };
  db.messages.push(msg);
  return res.json({ ok: true, message: msg });
});

app.delete("/api/messages/:id", requireAuth("admin"), (req, res) => {
  const id = Number(req.params.id);
  const before = db.messages.length;
  db.messages = db.messages.filter(m => m.id !== id);
  return res.json({ ok: true, removed: before !== db.messages.length });
});

// --- WEEKLY TOPIC ---
app.get("/api/weekly-topics/current", (req, res) => {
  const monday = getMondayISO(new Date());
  if (db.weeklyTopic?.weekStartISO !== monday) {
    db.weeklyTopic = { id: (db.weeklyTopic?.id ?? 1) + 1, title: "Új hét! Mi a heti témád?", weekStartISO: monday };
  }
  return res.json(db.weeklyTopic);
});

app.post("/api/weekly-topics/current", requireAuth("admin"), (req, res) => {
  const { title } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: "title is required." });

  const monday = getMondayISO(new Date());
  db.weeklyTopic = { id: (db.weeklyTopic?.id ?? 0) + 1, title: String(title).slice(0, 120), weekStartISO: monday };
  return res.json({ ok: true, weeklyTopic: db.weeklyTopic });
});

// --- NEWS (RSS) ---
const rss = new RSSParser();
const FEEDS = [
  { name: "PC Gamer", url: "https://www.pcgamer.com/rss/" },
  { name: "GameSpot", url: "https://www.gamespot.com/feeds/mashup/" },
  { name: "Game Rant", url: "https://gamerant.com/feed/" },
  { name: "IGN", url: "https://feeds.feedburner.com/ign/all" },
  { name: "Esport1", url: "https://esport1.hu/rss" }
];

app.get("/api/news", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 60), 120);
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async f => {
        const feed = await rss.parseURL(f.url);
        return (feed.items || []).slice(0, 40).map(it => ({
          source: f.name,
          title: it.title || "(nincs cím)",
          link: it.link,
          pubDate: it.isoDate || it.pubDate || null
        }));
      })
    );

    const items = results
      .flatMap(r => (r.status === "fulfilled" ? r.value : []))
      .filter(x => x.link)
      .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
      .slice(0, limit);

    return res.json({ ok: true, feeds: FEEDS.map(f => f.name), items });
  } catch {
    return res.status(500).json({ error: "Failed to load news feeds." });
  }
});

// --- SUPPORT / DONATE ---
app.post("/api/support", (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: "name, email, message are required." });
  return res.json({ ok: true, message: "Köszi! Megkaptuk az üzenetedet. (Demo válasz)" });
});

app.post("/api/donate", (req, res) => {
  const { amount, name, cardName, cardNumber, cardExp, cardCvc } = req.body || {};

  const amt = Number(amount);
  const num = String(cardNumber || "").replace(/\s+/g, "");
  const exp = String(cardExp || "").trim();
  const cvc = String(cardCvc || "").trim();

  function luhnOk(s){
    if(!/^[0-9]{12,19}$/.test(s)) return false;
    let sum = 0, alt = false;
    for(let i=s.length-1;i>=0;i--){
      let n = parseInt(s[i],10);
      if(alt){ n*=2; if(n>9) n-=9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  if(!amt || amt <= 0) return res.status(400).json({ error: "Valid amount is required." });
  if(!cardName) return res.status(400).json({ error: "cardName is required." });
  if(!luhnOk(num)) return res.status(400).json({ error: "Invalid cardNumber (demo check)." });
  if(!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp)) return res.status(400).json({ error: "cardExp must be MM/YY." });
  if(!/^\d{3,4}$/.test(cvc)) return res.status(400).json({ error: "cardCvc must be 3-4 digits." });

  return res.json({ ok: true, message: `Köszi a támogatást${name ? ", " + name : ""}! (Demo fizetés)` });
});

// --- SPA fallback ---
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Neon GameHub running: http://localhost:${PORT}`));
