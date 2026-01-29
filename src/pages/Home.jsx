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
  const featured = news?.[0];
  const restNews = news?.slice(1) ?? [];

  return (
    <>
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
                <NavLink className="btn neon-btn-outline btn-sm" to="/games">Összes</NavLink>
              </div>

              {/* Marad az auto marquee, de kisebb fókusz: a fő listát lentebb rendezzük */}
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
          </div>
        </div>
      </section>

      {/* 🔥 Top játékok – rendezett, olvasható slider */}
      <section className="section">
        <div className="ngh-shell">
          <div className="d-flex align-items-center justify-content-between">
            <div className="section-title">🔥 Top játékok</div>
            <NavLink className="btn neon-btn-outline btn-sm" to="/games">Összes játék</NavLink>
          </div>
          <div className="section-sub">Gördíts vízszintesen, vagy használj touchpadet – a hover mutatja a fókuszt.</div>

          <div className="slider home-top-slider" aria-label="Top játékok slider">
            {games.slice(0, 10).map((x) => (
              <div className="card hover slide p-2" key={x.id}>
                <img src={x.thumbnail} alt={x.title} />
                <div className="mt-2 fw-bold" style={{ fontSize: 15 }}>{x.title}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>
                  {x.genre} • {x.platform}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📰 Kiemelt hírek – 1 nagy + lista */}
      <section className="section">
        <div className="ngh-shell">
          <div className="d-flex align-items-center justify-content-between">
            <div className="section-title">📰 Kiemelt hírek</div>
            <NavLink className="btn neon-btn-outline btn-sm" to="/news">Összes hír</NavLink>
          </div>

          {news.length === 0 ? (
            <div className="section-sub">Most nincs hír, vagy nem sikerült betölteni.</div>
          ) : (
            <div className="news-hero-grid">
              {featured && (
                <a className="card hover news-hero-feature" href={featured.url} target="_blank" rel="noreferrer">
                  <div className="news-feature-source">{featured.source || "Forrás"}</div>
                  <div className="news-hero-title">{featured.title}</div>
                  <div className="news-hero-cta">Megnyitás →</div>
                </a>
              )}

              <div className="news-hero-list">
                {restNews.slice(0, 7).map((n, i) => (
                  <a
                    key={i}
                    className="news-hero-item"
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
          )}
        </div>
      </section>

      {/* 🏆 Legutóbbi GOTY-k – teljes szélesség, "büszke" blokk */}
      <section className="section">
        <div className="ngh-shell">
          <div className="d-flex align-items-center justify-content-between">
            <div className="section-title">🏆 Legutóbbi GOTY-k</div>
            <NavLink className="btn neon-btn-outline btn-sm" to="/goty">GOTY oldal</NavLink>
          </div>

          <div className="goty-cards">
            {goty.map((g) => (
              <a key={g.year} className="card hover goty-card" href={g.url} target="_blank" rel="noreferrer">
                <div className="goty-year">{g.year}</div>
                <div className="goty-game">{g.game}</div>
                <div className="goty-badge">Winner</div>
              </a>
            ))}
          </div>

          <div className="section-sub mt-3">
            (db.json-ből jön — a GOTY oldalon pontosan 10 év)
          </div>
        </div>
      </section>
    </>
  );
}
