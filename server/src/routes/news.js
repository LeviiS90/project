/**
 * GET /api/news
 *
 * MŰKÖDŐ források:
 * - RSS (kulcs nélkül) – ajánlott, stabil:
 *   PC Gamer, GameSpot, Esport1, Game Rant, Destructoid, Kotaku
 * - NewsAPI (API key) – JSON hírek
 * - GNews (API key) – JSON hírek
 *
 * Használat:
 * - /api/news                     -> .env NEWS_PROVIDER alapján
 * - /api/news?provider=rss        -> kényszerített RSS
 * - /api/news?provider=newsapi    -> kényszerített NewsAPI
 * - /api/news?provider=gnews      -> kényszerített GNews
 * - /api/news?limit=20
 */

import { Router } from "express";
import Parser from "rss-parser";
import dotenv from "dotenv";
dotenv.config();

export function newsRoutes() {
  const r = Router();
  const parser = new Parser({
    timeout: 8000,
    headers: {
      // Egyes oldalak jobban szeretik, ha van UA
      "User-Agent": "CyberGameHub/1.0 (+RSS Aggregator)"
    }
  });

  // ✅ VALÓBAN MŰKÖDŐ RSS feedek (kulcs nélkül)
  // PC Gamer RSS: https://www.pcgamer.com/rss/?feed=rss :contentReference[oaicite:3]{index=3}
  // Game Rant RSS: https://gamerant.com/feed/ :contentReference[oaicite:4]{index=4}
  // Kotaku RSS: https://kotaku.com/feed :contentReference[oaicite:5]{index=5}
  // Destructoid RSS: https://www.destructoid.com/feed/ :contentReference[oaicite:6]{index=6}
  // GameSpot RSS: https://www.gamespot.com/feeds/news/ :contentReference[oaicite:7]{index=7}
  // Esport1 RSS: (publikus RSS elérhető: esport1.hu/rss) :contentReference[oaicite:8]{index=8}
  const FEEDS = [
    { name: "PC Gamer", url: "https://www.pcgamer.com/rss/?feed=rss" },
    { name: "GameSpot", url: "https://www.gamespot.com/feeds/news/" },
    { name: "Esport1", url: "https://esport1.hu/rss" },
    { name: "Game Rant", url: "https://gamerant.com/feed/" },
    { name: "Destructoid", url: "https://www.destructoid.com/feed/" },
    { name: "Kotaku", url: "https://kotaku.com/feed" }
  ];

  // Egyszerű in-memory cache, hogy gyors legyen + ne DDOS-oljuk a feedeket
  const cache = {
    key: "",
    ts: 0,
    data: []
  };

  r.get("/", async (req, res) => {
    const provider = String(req.query.provider || process.env.NEWS_PROVIDER || "rss").toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || "18", 10), 50);

    const cacheSeconds = parseInt(process.env.NEWS_CACHE_SECONDS || "120", 10);
    const cacheKey = `${provider}:${limit}:${process.env.NEWS_LANG || ""}:${process.env.NEWS_COUNTRY || ""}`;

    // Cache találat
    if (cache.key === cacheKey && Date.now() - cache.ts < cacheSeconds * 1000) {
      return res.json(cache.data);
    }

    let items = [];

    if (provider === "newsapi") {
      items = await fromNewsApi(limit);
    } else if (provider === "gnews") {
      items = await fromGNews(limit);
    } else {
      items = await fromRss(parser, limit);
    }

    // Cache mentés
    cache.key = cacheKey;
    cache.ts = Date.now();
    cache.data = items;

    res.json(items);
  });

  return r;
}

/**
 * RSS aggregáció:
 * - több forrásból összefésül
 * - egységes mezők
 */
async function fromRss(parser, limit) {
  const items = [];

  await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const feed = await parser.parseURL(f.url);
        const slice = (feed.items || []).slice(0, 12);

        for (const it of slice) {
          items.push({
            provider: "rss",
            source: f.name,
            title: it.title || "",
            link: it.link || "",
            published: it.isoDate || it.pubDate || "",
            snippet: (it.contentSnippet || it.summary || "").toString().slice(0, 220),
            image: pickRssImage(it)
          });
        }
      } catch {
        // ha egy feed épp hibázik, a többi attól még menjen
      }
    })
  );

  items.sort((a, b) => (b.published || "").localeCompare(a.published || ""));
  return items.slice(0, limit);
}

/**
 * NewsAPI:
 * - Top headlines endpoint: /v2/top-headlines (API key kell) :contentReference[oaicite:9]{index=9}
 */
async function fromNewsApi(limit) {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    // Ha nincs key, visszaváltunk RSS-re (stabil fallback)
    return await fromRss(new (await import("rss-parser")).default(), limit);
  }

  const country = process.env.NEWS_COUNTRY || "us";
  const q = "game OR gaming OR esports OR pc";

  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", country);
  url.searchParams.set("pageSize", String(Math.min(limit, 50)));
  url.searchParams.set("q", q);
  url.searchParams.set("apiKey", key);

  const resp = await fetch(url, { headers: { "User-Agent": "CyberGameHub/1.0" } });
  if (!resp.ok) return [];

  const data = await resp.json();

  return (data.articles || []).map((a) => ({
    provider: "newsapi",
    source: a.source?.name || "NewsAPI",
    title: a.title || "",
    link: a.url || "",
    published: a.publishedAt || "",
    snippet: (a.description || "").slice(0, 220),
    image: a.urlToImage || ""
  }));
}

/**
 * GNews:
 * - Docs: docs.gnews.io (API key kell) :contentReference[oaicite:10]{index=10}
 */
async function fromGNews(limit) {
  const key = process.env.GNEWS_KEY;
  if (!key) {
    // fallback RSS-re
    return await fromRss(new (await import("rss-parser")).default(), limit);
  }

  const lang = process.env.NEWS_LANG || "en";
  const q = "gaming OR esports OR PC games";

  const url = new URL("https://gnews.io/api/v4/top-headlines");
  url.searchParams.set("lang", lang);
  url.searchParams.set("max", String(Math.min(limit, 50)));
  url.searchParams.set("q", q);
  url.searchParams.set("apikey", key);

  const resp = await fetch(url, { headers: { "User-Agent": "CyberGameHub/1.0" } });
  if (!resp.ok) return [];

  const data = await resp.json();

  return (data.articles || []).map((a) => ({
    provider: "gnews",
    source: a.source?.name || "GNews",
    title: a.title || "",
    link: a.url || "",
    published: a.publishedAt || "",
    snippet: (a.description || "").slice(0, 220),
    image: a.image || ""
  }));
}

/**
 * RSS képkiválasztás:
 * - enclosure / media:content / media:thumbnail jellegű mezőket próbáljuk
 */
function pickRssImage(it) {
  // enclosure
  if (it.enclosure?.url) return it.enclosure.url;

  // rss-parser gyakran beteszi az extra mezőket "it" alá
  const mc = it["media:content"]?.["$"]?.url || it["media:content"]?.url;
  if (mc) return mc;

  const mt = it["media:thumbnail"]?.["$"]?.url || it["media:thumbnail"]?.url;
  if (mt) return mt;

  return "";
}
