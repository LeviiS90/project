/**
 * NEXUS GG — Express REST API + statikus React(JSX) kliens.
 * ------------------------------------------------------------
 * Verzió: Supabase (PostgreSQL) perzisztenciával.
 *
 * Telepítés:
 * 1) Node.js 18+
 * 2) npm remove mysql2 && npm install @supabase/supabase-js
 * 3) .env-be: SUPABASE_URL + SUPABASE_SERVICE_KEY
 * 4) Supabase SQL Editorban futtasd a táblákat (lásd docs)
 * 5) npm start
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
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --- Statikus kliens (public) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// --- Konfig ---
const PORT       = process.env.PORT       || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// --- Supabase ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// --- Stripe (OPCIONÁLIS) ---
const STRIPE_SECRET_KEY   = process.env.STRIPE_SECRET_KEY   || "";
const STRIPE_CURRENCY     = process.env.STRIPE_CURRENCY     || "eur";
const STRIPE_AMOUNT_CENTS = Number(process.env.STRIPE_AMOUNT_CENTS || 499);
const STRIPE_PRODUCT_NAME = process.env.STRIPE_PRODUCT_NAME || "NEXUS GG hozzáférés";
const STRIPE_BASE_URL     = process.env.STRIPE_BASE_URL     || "";

function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
}

// --- Supabase helper ---
// Egységes hibakezelés: ha Supabase error-t dob, eldobjuk
async function sb(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

// --- Seed adatok ---
async function seedIfNeeded() {
  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@local";
  const adminPass  = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await sb(
    supabase.from("users").select("id").eq("email", adminEmail).limit(1)
  );
  if (!existing.length) {
    const hash = bcrypt.hashSync(adminPass, 10);
    await sb(
      supabase.from("users").insert({ name: "admin", email: adminEmail, password: hash, role: "admin" })
    );
  }

  // Weekly topic (jelenlegi hét)
  const monday = getMondayISO(new Date());
  const wt = await sb(
    supabase.from("weekly_topics").select("id").eq("weekStart", monday).limit(1)
  );
  if (!wt.length) {
    const inserted = await sb(
      supabase.from("weekly_topics")
        .insert({ weekStart: monday, activeTopic: "Mi volt a legjobb boss fight élményed?" })
        .select("id")
    );
    const weeklyId = inserted[0].id;
    const defaultItems = ["Legjobb story", "Legjobb gameplay", "Legjobb zene"];
    for (const topic of defaultItems) {
      await sb(supabase.from("weekly_topics_items").insert({ weekly_id: weeklyId, topic }));
    }
  }

  // GOTY TGA győztesek (ha üres)
    const { count: gotyCount } = await supabase
    .from("goty")
    .select("*", { count: "exact", head: true });
    if (!gotyCount || gotyCount === 0) {
    const gotyData = [
      { year: 2026, game: "TBA – Az év játéka",        url: "https://www.thegameawards.com/", cover: "" },
      { year: 2025, game: "TBA – Hamarosan kiderül",   url: "https://www.thegameawards.com/", cover: "" },
      { year: 2024, game: "Astro Bot",                  url: "https://www.astro-bot.com/",     cover: "https://upload.wikimedia.org/wikipedia/en/2/2e/Astro_Bot_cover_art.jpg" },
      { year: 2023, game: "Baldur's Gate 3",            url: "https://baldursgate3.game/",     cover: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg" },
      { year: 2022, game: "Elden Ring",                 url: "https://en.bandainamcoent.eu/elden-ring/elden-ring", cover: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg" },
      { year: 2021, game: "It Takes Two",               url: "https://www.hazelight.se/game/it-takes-two/",        cover: "https://cdn.akamai.steamstatic.com/steam/apps/1426210/header.jpg" },
      { year: 2020, game: "The Last of Us Part II",     url: "https://www.playstation.com/en-us/games/the-last-of-us-part-ii/", cover: "https://cdn.akamai.steamstatic.com/steam/apps/2455740/header.jpg" },
      { year: 2019, game: "Death Stranding",            url: "https://www.kojimaproductions.jp/en/death-stranding-dc", cover: "https://cdn.akamai.steamstatic.com/steam/apps/1190460/header.jpg" },
      { year: 2018, game: "God of War",                 url: "https://www.playstation.com/en-us/games/god-of-war/", cover: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg" },
      { year: 2017, game: "The Legend of Zelda: Breath of the Wild", url: "https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/The-Legend-of-Zelda-Breath-of-the-Wild-1173609.html", cover: "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg" },
      { year: 2016, game: "Overwatch",                  url: "https://overwatch.blizzard.com/", cover: "https://cdn.akamai.steamstatic.com/steam/apps/2357570/header.jpg" },
      { year: 2015, game: "The Witcher 3: Wild Hunt",   url: "https://www.thewitcher.com/en/witcher3", cover: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg" },
      { year: 2014, game: "Dragon Age: Inquisition",    url: "https://www.ea.com/games/dragon-age/dragon-age-inquisition", cover: "https://cdn.akamai.steamstatic.com/steam/apps/1222690/header.jpg" },
    ];
    await sb(supabase.from("goty").insert(gotyData));
  }
}

// --- Helpers ---
function getMondayISO(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function requireAuth(requiredRole = null) {
  return (req, res, next) => {
    const auth  = req.headers.authorization || "";
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

function getBaseUrl(req) {
  if (STRIPE_BASE_URL) return STRIPE_BASE_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").toString();
  return `${proto}://${req.headers.host}`;
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ error: "Hiányzó mezők (name, email, password)." });

  const exists = await sb(
    supabase.from("users").select("id").or(`email.eq.${email},name.eq.${name}`).limit(1)
  );
  if (exists.length)
    return res.status(409).json({ error: "Foglalt név vagy email. Válassz másikat." });

  const stripe = getStripe();
  if (!stripe) {
    const hash = bcrypt.hashSync(password, 10);
    await sb(supabase.from("users").insert({ name, email, password: hash, role: "user" }));
    return res.json({ ok: true });
  }

  // Stripe Checkout flow
  const pendingId = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 10);
  globalThis.__pendingUsers = globalThis.__pendingUsers || new Map();
  globalThis.__pendingUsers.set(pendingId, { name, email, hash });

  const base    = getBaseUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency:     STRIPE_CURRENCY,
        unit_amount:  STRIPE_AMOUNT_CENTS,
        product_data: { name: STRIPE_PRODUCT_NAME },
      },
      quantity: 1,
    }],
    success_url: `${base}/#/register-success?pid=${encodeURIComponent(pendingId)}`,
    cancel_url:  `${base}/#/register-cancel`,
  });
  return res.json({ checkoutUrl: session.url });
});

app.post("/api/auth/activate", async (req, res) => {
  const { pid }  = req.body || {};
  const store    = globalThis.__pendingUsers;
  if (!pid || !store?.has(pid))
    return res.status(400).json({ error: "Érvénytelen aktiválás." });

  const { name, email, hash } = store.get(pid);
  store.delete(pid);

  const exists = await sb(
    supabase.from("users").select("id").or(`email.eq.${email},name.eq.${name}`).limit(1)
  );
  if (exists.length)
    return res.status(409).json({ error: "Foglalt név vagy email." });

  await sb(supabase.from("users").insert({ name, email, password: hash, role: "user" }));
  return res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password)
    return res.status(400).json({ error: "Hiányzó mezők (identifier, password)." });

  const isEmail = String(identifier).includes("@");
  const field   = isEmail ? "email" : "name";
  const rows    = await sb(
    supabase.from("users")
      .select("id, name, email, password, role")
      .eq(field, identifier)
      .limit(1)
  );

  if (!rows.length)
    return res.status(401).json({ error: "Hibás név/email vagy jelszó." });

  const u  = rows[0];
  const ok = bcrypt.compareSync(password, u.password);
  if (!ok)
    return res.status(401).json({ error: "Hibás név/email vagy jelszó." });

  const token = signToken({ id: u.id, name: u.name, email: u.email, role: u.role });
  return res.json({ token, user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});

// ═══════════════════════════════════════
// GAMES (RAWG proxy — nincs DB)
// ═══════════════════════════════════════

app.get("/api/games", async (req, res) => {
  const platform = (req.query.platform || "pc").toString().toLowerCase();
  const search   = (req.query.search   || "").toString();
  const ordering = (req.query.ordering || "-added").toString();
  const RAWG_KEY = process.env.RAWG_API_KEY;

  const platformIds = { pc: "4", browser: "171", console: "187,18,186,1,7", all: "" };
  const p = platformIds[platform] ?? platformIds.pc;

  function mapGame(it) {
    const platNames = (it.platforms || []).map(x => x?.platform?.name).filter(Boolean);
    let platTag = "PC";
    if (platNames.some(n => /web/i.test(n))) platTag = "BROWSER";
    else if (platNames.some(n => /playstation|xbox|nintendo/i.test(n)) && !platNames.some(n => /pc/i.test(n))) platTag = "CONSOLE";
    else if (platNames.some(n => /playstation|xbox|nintendo/i.test(n))) platTag = "PC/CONSOLE";
    return {
      id: it.id, title: it.name,
      thumbnail: it.background_image || "",
      short_description: (it.slug || "").replace(/-/g, " "),
      genre:        it.genres?.[0]?.name || "",
      platform:     platTag,
      publisher:    it.publishers?.[0]?.name || "",
      developer:    it.developers?.[0]?.name || it.publishers?.[0]?.name || "",
      release_date: it.released || "",
      game_url:     it.website  || "",
      rating:       it.rating   || 0,
    };
  }

  // Paged mode (Games oldal)
  if (req.query.page !== undefined && RAWG_KEY) {
    const page     = Math.max(1, parseInt(req.query.page     || "1",  10));
    const pageSize = Math.min(40, Math.max(1, parseInt(req.query.page_size || "12", 10)));
    const genreSlugMap = {
      "mmorpg":"massively-multiplayer","shooter":"shooter","strategy":"strategy",
      "moba":"strategy","racing":"racing","sports":"sports","social":"massively-multiplayer",
      "sandbox":"simulation","open-world":"action","survival":"action","pvp":"action",
      "pve":"rpg","pixel":"indie","anime":"action","fantasy":"rpg","sci-fi":"action",
      "fighting":"fighting","action-rpg":"rpg","battle-royale":"shooter",
    };
    const rawGenres  = (req.query.genres || "").toString().split(",").map(s=>s.trim()).filter(Boolean);
    const rawgGenres = [...new Set(rawGenres.map(g => genreSlugMap[g] || g))];
    const qs = new URLSearchParams();
    qs.set("key", RAWG_KEY); qs.set("page", String(page)); qs.set("page_size", String(pageSize));
    if (p)               qs.set("platforms", p);
    if (search)          qs.set("search",    search);
    if (ordering)        qs.set("ordering",  ordering);
    if (rawgGenres.length) qs.set("genres",  rawgGenres.join(","));
    const r = await fetch(`https://api.rawg.io/api/games?${qs}`);
    if (!r.ok) return res.status(502).json({ error: "RAWG API hiba." });
    const j = await r.json();
    return res.json({ results: (j.results||[]).map(mapGame), count: j.count||0, next: !!j.next });
  }

  // Bulk mode (főoldal carousel)
  const limit     = Math.min(parseInt(req.query.limit || "200", 10) || 200, 1000);
  const pageSize2 = 40;
  globalThis.__gamesCache = globalThis.__gamesCache || new Map();
  const cacheKey = JSON.stringify({ platform, search, limit, ordering });
  const now      = Date.now();
  const cached   = globalThis.__gamesCache.get(cacheKey);
  if (cached && (now - cached.at) < 10 * 60 * 1000) return res.json(cached.data);

  if (RAWG_KEY) {
    const out = []; let page = 1;
    while (out.length < limit && page <= 30) {
      const qs = new URLSearchParams();
      qs.set("key", RAWG_KEY); qs.set("page", String(page)); qs.set("page_size", String(pageSize2));
      if (p)        qs.set("platforms", p);
      if (search)   qs.set("search",    search);
      if (ordering) qs.set("ordering",  ordering);
      const r = await fetch(`https://api.rawg.io/api/games?${qs}`);
      if (!r.ok) return res.status(502).json({ error: "RAWG API hiba." });
      const j = await r.json();
      const results = Array.isArray(j.results) ? j.results : [];
      for (const it of results) { out.push(mapGame(it)); if (out.length >= limit) break; }
      if (!j.next || results.length === 0) break;
      page++;
    }
    globalThis.__gamesCache.set(cacheKey, { at: now, data: out });
    return res.json(out);
  }

  return res.status(503).json({ error: "RAWG API kulcs nincs beállítva." });
});

app.get("/api/games/:id", async (req, res) => {
  const id       = req.params.id;
  const RAWG_KEY = process.env.RAWG_API_KEY;
  if (RAWG_KEY) {
    const r = await fetch(`https://api.rawg.io/api/games/${encodeURIComponent(id)}?key=${RAWG_KEY}`);
    if (!r.ok) return res.status(502).json({ error: "RAWG API hiba." });
    const it = await r.json();
    const platNames = (it.platforms||[]).map(p=>p?.platform?.name).filter(Boolean);
    return res.json({
      id: it.id, title: it.name,
      thumbnail:   it.background_image || "",
      status:      it.released ? "Released" : "",
      short_description: (it.description_raw||"").slice(0,400) + ((it.description_raw||"").length>400?"…":""),
      description: it.description_raw || "",
      genre:       (it.genres||[]).map(g=>g.name).join(", "),
      platform:    platNames.join(", "),
      publisher:   "",
      developer:   (it.developers||[]).map(d=>d.name).join(", "),
      release_date: it.released || "",
      game_url:     it.website  || "",
      minimum_system_requirements: null,
      screenshots: (it.short_screenshots||[]).map(s=>({ image: s.image })),
    });
  }
  return res.status(503).json({ error: "RAWG API kulcs nincs beállítva." });
});

// ═══════════════════════════════════════
// GOTY
// ═══════════════════════════════════════

app.get("/api/goty", async (_req, res) => {
  const rows = await sb(
    supabase.from("goty").select("year, game, url, cover").order("year", { ascending: false })
  );
  return res.json(rows);
});

app.post("/api/goty", requireAuth("admin"), async (req, res) => {
  const { year, game, url, cover } = req.body || {};
  if (!year || !game) return res.status(400).json({ error: "Hiányzó mezők (year, game)." });
  await sb(
    supabase.from("goty").upsert(
      { year: Number(year), game: String(game), url: url||null, cover: cover||null },
      { onConflict: "year" }
    )
  );
  return res.json({ ok: true });
});

app.delete("/api/goty/:year", requireAuth("admin"), async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (!year) return res.status(400).json({ error: "Érvénytelen év." });
  await sb(supabase.from("goty").delete().eq("year", year));
  return res.json({ ok: true });
});

// ═══════════════════════════════════════
// WEEKLY TOPICS
// ═══════════════════════════════════════

app.get("/api/weekly-topics/current", async (_req, res) => {
  const monday = getMondayISO(new Date());
  let rows = await sb(
    supabase.from("weekly_topics").select("id, weekStart, activeTopic")
      .eq("weekStart", monday).order("id", { ascending: false }).limit(1)
  );
  if (!rows.length) {
    await seedIfNeeded();
    rows = await sb(
      supabase.from("weekly_topics").select("id, weekStart, activeTopic")
        .eq("weekStart", monday).order("id", { ascending: false }).limit(1)
    );
  }
  const t = rows[0];
  return res.json({ id: t.id, title: t.activeTopic, weekStartISO: String(t.weekStart) });
});

app.post("/api/weekly-topics/current", requireAuth("admin"), async (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: "Hiányzó mező: title" });

  const now   = new Date();
  const day   = now.getDay();
  const daysUntilNextMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);
  const nextMondayISO = getMondayISO(nextMonday);

  const rows = await sb(
    supabase.from("weekly_topics").select("id").eq("weekStart", nextMondayISO)
      .order("id", { ascending: false }).limit(1)
  );
  if (rows.length) {
    await sb(supabase.from("weekly_topics").update({ activeTopic: String(title) }).eq("id", rows[0].id));
  } else {
    await sb(supabase.from("weekly_topics").insert({ weekStart: nextMondayISO, activeTopic: String(title) }));
  }
  return res.json({ ok: true, scheduledFor: nextMondayISO });
});

// ═══════════════════════════════════════
// MESSAGES (fali üzenetek)
// ═══════════════════════════════════════

app.get("/api/messages", async (_req, res) => {
  const monday = getMondayISO(new Date());
  // Supabase-ben nincs natív LEFT JOIN a JS kliensben, ezért két lekérés
  const messages = await sb(
    supabase.from("messages").select("id, email, message, created_at")
      .eq("week_start", monday).order("created_at", { ascending: false }).limit(200)
  );
  const emails = [...new Set(messages.map(m => m.email))];
  let userMap = {};
  if (emails.length) {
    const users = await sb(
      supabase.from("users").select("email, name").in("email", emails)
    );
    userMap = Object.fromEntries(users.map(u => [u.email, u.name]));
  }
  return res.json(messages.map(m => ({
    ...m,
    display_name: userMap[m.email] || m.email,
  })));
});

app.post("/api/messages", requireAuth(), async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "Hiányzó mező: text" });
  const monday = getMondayISO(new Date());
  await sb(supabase.from("messages").insert({ email: req.user.email, message: String(text), week_start: monday }));
  return res.json({ ok: true });
});

app.delete("/api/messages/:id", requireAuth("admin"), async (req, res) => {
  await sb(supabase.from("messages").delete().eq("id", Number(req.params.id)));
  return res.json({ ok: true });
});

// ═══════════════════════════════════════
// PRIVÁT ÜZENETEK
// ═══════════════════════════════════════

app.get("/api/pm/users", requireAuth(), async (req, res) => {
  const rows = await sb(
    supabase.from("users").select("id, name, email")
      .neq("id", req.user.sub).order("name")
  );
  return res.json(rows.map(r => ({ id: r.id, name: r.name, email: r.email })));
});

app.get("/api/pm/unread", requireAuth(), async (req, res) => {
  const { count } = await supabase.from("private_messages")
    .select("*", { count: "exact", head: true })
    .eq("to_id", req.user.sub)
    .is("read_at", null);
  return res.json({ count: count || 0 });
});

app.get("/api/pm", requireAuth(), async (req, res) => {
  const inbox = await sb(
    supabase.from("private_messages")
      .select("id, from_id, from_name, to_id, to_name, message, read_at, created_at")
      .eq("to_id", req.user.sub).order("created_at", { ascending: false }).limit(100)
  );
  const sent = await sb(
    supabase.from("private_messages")
      .select("id, from_id, from_name, to_id, to_name, message, read_at, created_at")
      .eq("from_id", req.user.sub).order("created_at", { ascending: false }).limit(50)
  );
  return res.json({ inbox, sent });
});

app.post("/api/pm", requireAuth(), async (req, res) => {
  const { to, message } = req.body || {};
  if (!to || !message?.trim()) return res.status(400).json({ error: "Hiányzó adatok." });

  const recipients = await sb(
    supabase.from("users").select("id, name").or(`name.eq.${to},email.eq.${to}`).limit(1)
  );
  if (!recipients.length) return res.status(404).json({ error: "Felhasználó nem található." });
  const recipient = recipients[0];
  if (recipient.id === req.user.sub)
    return res.status(400).json({ error: "Saját magadnak nem küldhetsz üzenetet." });

  await sb(supabase.from("private_messages").insert({
    from_id:   req.user.sub,
    from_name: req.user.name || req.user.email,
    to_id:     recipient.id,
    to_name:   recipient.name,
    message:   message.trim(),
  }));
  return res.json({ ok: true });
});

app.put("/api/pm/:id/read", requireAuth(), async (req, res) => {
  await sb(
    supabase.from("private_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("to_id", req.user.sub)
      .is("read_at", null)
  );
  return res.json({ ok: true });
});

app.delete("/api/pm/:id", requireAuth(), async (req, res) => {
  await sb(
    supabase.from("private_messages")
      .delete()
      .eq("id", req.params.id)
      .or(`from_id.eq.${req.user.sub},to_id.eq.${req.user.sub}`)
  );
  return res.json({ ok: true });
});

// ═══════════════════════════════════════
// SUPPORT + DONATE
// ═══════════════════════════════════════

app.post("/api/support", async (req, res) => {
  const { email, message } = req.body || {};
  if (!email || !message) return res.status(400).json({ error: "Hiányzó mezők (email, message)." });
  await sb(supabase.from("support").insert({ email: String(email), message: String(message) }));
  return res.json({ ok: true });
});

app.post("/api/donate", async (req, res) => {
  const { email, amount } = req.body || {};
  const a = Number(amount);
  if (!email || !Number.isFinite(a) || a <= 0)
    return res.status(400).json({ error: "Hibás mezők (email, amount>0)." });
  await sb(supabase.from("donations").insert({ email: String(email), amount: Math.floor(a) }));
  return res.json({ ok: true });
});

// ═══════════════════════════════════════
// NEWS (RSS aggregator — nincs DB)
// ═══════════════════════════════════════

const parser = new RSSParser({ headers: { "User-Agent": "NexusGG/1.0 (+local project)" } });
const RSS_FEEDS = [
  { name: "IGN",               url: "https://feeds.ign.com/ign/all" },
  { name: "PC Gamer",          url: "https://www.pcgamer.com/rss/" },
  { name: "GameSpot",          url: "https://www.gamespot.com/feeds/mashup/" },
  { name: "Eurogamer",         url: "https://www.eurogamer.net/feed" },
  { name: "Rock Paper Shotgun",url: "https://www.rockpapershotgun.com/feed" },
  { name: "Polygon",           url: "https://www.polygon.com/rss/index.xml" },
];
let NEWS_CACHE = { at: 0, items: [], sources: [] };
const NEWS_CACHE_MS = 10 * 60 * 1000;

function toDateValue(s) { const t = new Date(s).getTime(); return Number.isFinite(t) ? t : 0; }

async function refreshNewsCache() {
  const items = []; const sources = [];
  for (const f of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);
      sources.push(f.name);
      for (const it of (feed.items||[]).slice(0,80)) {
        items.push({ title: it.title||"", link: it.link||"", pubDate: it.isoDate||it.pubDate||"", source: f.name });
      }
    } catch { /* forrás nem elérhető, folytassuk */ }
  }
  items.sort((a,b) => toDateValue(b.pubDate) - toDateValue(a.pubDate));
  const seen = new Set(); const deduped = [];
  for (const it of items) {
    const key = it.link || (it.title+"|"+it.source);
    if (seen.has(key)) continue;
    seen.add(key); deduped.push(it);
  }
  NEWS_CACHE = { at: Date.now(), items: deduped, sources };
  return NEWS_CACHE;
}

app.get("/api/news", async (req, res) => {
  const limitRaw = Number(req.query.limit ?? 200);
  const limit    = Number.isFinite(limitRaw) ? Math.max(1, Math.min(300, Math.floor(limitRaw))) : 100;
  try {
    if (!NEWS_CACHE.at || (Date.now() - NEWS_CACHE.at) > NEWS_CACHE_MS) await refreshNewsCache();
    return res.json({
      ok: true, items: (NEWS_CACHE.items||[]).slice(0, limit),
      sources: NEWS_CACHE.sources||[], cachedAt: NEWS_CACHE.at, total: (NEWS_CACHE.items||[]).length,
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Nem sikerült beolvasni a híreket." });
  }
});

// --- SPA fallback ---
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ═══════════════════════════════════════
// BOOT
// ═══════════════════════════════════════

import { pathToFileURL } from "url";

export async function startServer() {
  console.log("Supabase kapcsolat ellenőrzése...");
  // Gyors ping: ha a tábla nem létezik, itt kapunk hibát
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    console.error("Supabase hiba:", error.message);
    console.error("Ellenőrizd: 1) SUPABASE_URL és SUPABASE_SERVICE_KEY helyes-e? 2) Táblák létrehozva az SQL Editorban?");
    process.exit(1);
  }
  await seedIfNeeded();
  return app.listen(PORT, () => console.log(`NEXUS GG running on http://localhost:${PORT}`));
}

export default app;

if (import.meta.url === pathToFileURL(process.argv[1]).href && process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await startServer();
    } catch (e) {
      console.error("[BOOT ERROR]", e);
      process.exit(1);
    }
  })();
}