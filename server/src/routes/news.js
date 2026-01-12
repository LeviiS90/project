/**
 * GET /api/news
 * - provider=rss|newsapi|gnews (default: .env NEWS_PROVIDER)
 * - limit=1..50
 *
 * Működő RSS források (kulcs nélkül):
 * - PC Gamer, GameSpot, Esport1, Game Rant, Destructoid, Kotaku
 *
 * API-key opció:
 * - NewsAPI / GNews (ha van kulcs, .env-ben)
 */
import { Router } from "express";
import Parser from "rss-parser";
import dotenv from "dotenv";
dotenv.config();

const FEEDS = [
  { name: "PC Gamer", url: "https://www.pcgamer.com/rss/?feed=rss" },
  { name: "GameSpot", url: "https://www.gamespot.com/feeds/news/" },
  { name: "Esport1", url: "https://esport1.hu/rss" },
  { name: "Game Rant", url: "https://gamerant.com/feed/" },
  { name: "Destructoid", url: "https://www.destructoid.com/feed/" },
  { name: "Kotaku", url: "https://kotaku.com/feed" }
];

export function newsRoutes() {
  const r = Router();
  const parser = new Parser({
    timeout: 8000,
    headers: { "User-Agent": "CyberGameHub/1.0 (+RSS Aggregator)" }
  });

  const cache = { key: "", ts: 0, data: [] };

  r.get("/", async (req, res) => {
    const provider = String(req.query.provider || process.env.NEWS_PROVIDER || "rss").toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || "18", 10), 50);

    const cacheSeconds = parseInt(process.env.NEWS_CACHE_SECONDS || "120", 10);
    const cacheKey = `${provider}:${limit}:${process.env.NEWS_LANG || ""}:${process.env.NEWS_COUNTRY || ""}`;

    if (cache.key === cacheKey && Date.now() - cache.ts < cacheSeconds * 1000) {
      return res.json(cache.data);
    }

    let items = [];
    if (provider === "newsapi") items = await fromNewsApi(limit);
    else if (provider === "gnews") items = await fromGNews(limit);
    else items = await fromRss(parser, limit);

    cache.key = cacheKey;
    cache.ts = Date.now();
    cache.data = items;

    res.json(items);
  });

  return r;
}

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
        // ha egy feed hibázik, nem állítjuk le az egészet
      }
    })
  );

  items.sort((a, b) => (b.published || "").localeCompare(a.published || ""));
  return items.slice(0, limit);
}

async function fromNewsApi(limit) {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return await fromRss(new Parser(), limit);

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

async function fromGNews(limit) {
  const key = process.env.GNEWS_KEY;
  if (!key) return await fromRss(new Parser(), limit);

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

function pickRssImage(it) {
  if (it.enclosure?.url) return it.enclosure.url;
  const mc = it["media:content"]?.["$"]?.url || it["media:content"]?.url;
  if (mc) return mc;
  const mt = it["media:thumbnail"]?.["$"]?.url || it["media:thumbnail"]?.url;
  if (mt) return mt;
  return "";
}
