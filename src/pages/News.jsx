import { useEffect, useMemo, useState } from "react";
import { getNewsAggregate } from "../api.js";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}p`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}ó`;
  const days = Math.floor(h / 24);
  return `${days}n`;
}

export default function News() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 18;

  useEffect(() => {
    (async () => {
      try {
        const data = await getNewsAggregate({ limit: 120 });
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  const sources = useMemo(() => {
    const s = new Set(items.map((x) => x.source).filter(Boolean));
    return ["all", ...Array.from(s).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      if (source !== "all" && x.source !== source) return false;
      if (!q) return true;
      return (x.title || "").toLowerCase().includes(q);
    });
  }, [items, query, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, source]);

  return (
    <div>
      <div className="d-flex flex-wrap gap-3 align-items-end justify-content-between">
        <div>
          <h1 className="glow-title" style={{ fontSize: 32, marginBottom: 6 }}>Hírek</h1>
          <div className="section-sub">Sok forrásból (RSS) – frissül, ha van neted.</div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <input
            className="form-control neon-input"
            style={{ minWidth: 220 }}
            placeholder="Keresés címben…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className="form-select neon-input"
            style={{ minWidth: 200 }}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s} value={s}>{s === "all" ? "Összes forrás" : s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 news-grid">
        {paged.length === 0 && (
          <div className="card soft p-4">
            <div className="section-title">Nincs találat</div>
            <div className="section-sub">Próbáld más kulcsszóval, vagy nézd meg később.</div>
          </div>
        )}

        {paged.map((n, i) => (
          <a
            key={`${n.url}-${i}`}
            className="card hover p-3 news-card"
            href={n.url}
            target="_blank"
            rel="noreferrer"
          >
            <div className="d-flex justify-content-between gap-3">
              <div className="badge-neon" style={{ fontSize: 12 }}>{n.source || "Forrás"}</div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>{timeAgo(n.publishedAt)}</div>
            </div>
            <div className="mt-2 fw-bold" style={{ lineHeight: 1.3 }}>{n.title}</div>
            <div className="section-sub mt-2">Katt → megnyitás új lapon</div>
          </a>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-center mt-4">
        <button
          className="btn neon-btn-outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage <= 1}
        >
          ← Előző
        </button>
        <div className="badge-neon" style={{ alignSelf: "center" }}>
          {safePage} / {totalPages} (találat: {filtered.length})
        </div>
        <button
          className="btn neon-btn-outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage >= totalPages}
        >
          Következő →
        </button>
      </div>
    </div>
  );
}
