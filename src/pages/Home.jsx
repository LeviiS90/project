import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { getGames, getGoty, getNewsAggregate } from "../api.js";

export default function Home() {
  const [games, setGames] = useState([]);
  const [news, setNews] = useState([]);
  const [goty, setGoty] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const g = await getGames();
        setGames(g.slice(0, 12));
        setNews(await getNewsAggregate({ limit: 8 }));
        const y = await getGoty();
        setGoty(y.slice(-3).reverse());
      } catch {}
    })();
  }, []);

  const marqueeGames = useMemo(() => [...games, ...games], [games]);

  return (
    <section className="hero" id="home">
      <div className="ngh-shell hero-split">
        <div className="hero-copy">
          <div className="badge-neon mb-2">⚡ Neon Gaming Hub</div>
          <h1 className="glow-title" style={{ marginBottom: 10 }}>
            A játék jövője itt kezdődik
          </h1>
          <p className="hero-sub">
            Ingyenes játékok, friss hírek több forrásból, GOTY lista és közösségi üzenőfal.
          </p>

          <div className="hero-actions mt-3">
            <NavLink className="btn neon-btn" to="/games">🎮 Játékok</NavLink>
            <NavLink className="btn neon-btn-outline" to="/news">📰 Hírek</NavLink>
            <NavLink className="btn neon-btn-outline" to="/goty">🏆 GOTY</NavLink>
            <NavLink className="btn neon-btn-outline" to="/wall">💬 Üzenőfal</NavLink>
          </div>

          <div className="hero-metrics mt-4">
            <div className="metric">
              <div className="metric-num">{games.length || "—"}</div>
              <div className="metric-label">Top játék</div>
            </div>
            <div className="metric">
              <div className="metric-num">{news.length || "—"}</div>
              <div className="metric-label">Friss hír</div>
            </div>
            <div className="metric">
              <div className="metric-num">10</div>
              <div className="metric-label">GOTY év</div>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="card soft p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="section-title" style={{ marginBottom: 0 }}>🔥 Top játékok</div>
              <div className="section-sub">auto • végtelen</div>
            </div>

            <div className="marquee mt-3" aria-label="Top játékok végtelen slider">
              <div className="marquee-track">
                {marqueeGames.map((x, idx) => (
                  <div className="marquee-item" key={`${x.id}-${idx}`}>
                    <div className="card hover slide p-2">
                      <img src={x.thumbnail} alt={x.title} />
                      <div className="mt-2 fw-bold" style={{ fontSize: 14 }}>{x.title}</div>
                      <div style={{ opacity: 0.8, fontSize: 12 }}>
                        {x.genre} • {x.platform}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-12">
              <div className="card hover p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="section-title" style={{ marginBottom: 0 }}>📰 Kiemelt hírek</div>
                  <NavLink className="btn neon-btn-outline btn-sm" to="/news">Összes hír</NavLink>
                </div>

                <div className="news-feature mt-3">
                  {news.length === 0 && (
                    <div className="section-sub">Most nincs hír, vagy nem sikerült betölteni.</div>
                  )}

                  {news.map((n, i) => (
                    <a
                      key={i}
                      className="news-feature-item"
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="news-feature-source">{n.source || "Forrás"}</div>
                      <div className="news-feature-title">{n.title}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card hover p-3">
                <div className="section-title">🏆 Legutóbbi GOTY-k</div>
                <div className="d-flex gap-2 flex-wrap mt-2">
                  {goty.map((g) => (
                    <a key={g.year} className="btn neon-btn-outline goty-chip" href={g.url} target="_blank" rel="noreferrer">
                      {g.year}: {g.game}
                    </a>
                  ))}
                </div>
                <div className="section-sub mt-3">
                  (db.json-ből jön — a GOTY oldalon pontosan 10 év)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
