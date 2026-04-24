/**
 * components/HomeWidgets.jsx
 * --------------------------
 * Home oldali widgetek:
 * - TopGamesCarousel (szebb slider)
 * - NewsPanel (szebb hírkártyák)
 * - News oldal (saját route #/news)
 */
window.NGH = window.NGH || {};
window.NGH.components = window.NGH.components || {};

const { useEffect, useState } = React;

/* ───────────────────────────────────────
   TopGamesCarousel
─────────────────────────────────────── */
window.NGH.components.TopGamesCarousel = function TopGamesCarousel(){
  const SectionTitle = window.NGH.components.SectionTitle;

  const FEATURED_GAMES = [
    {
      id:"cs2", title:"Counter-Strike 2", genre:"Shooter", platform:"PC", rating:4.8,
      thumbnail:"https://cdn.akamai.steamstatic.com/steam/apps/730/library_hero.jpg",
      game_url:"https://store.steampowered.com/app/730/CounterStrike_2/"
    },
    {
      id:"dota2", title:"Dota 2", genre:"MOBA", platform:"PC", rating:4.6,
      thumbnail:"https://cdn.akamai.steamstatic.com/steam/apps/570/library_hero.jpg",
      game_url:"https://store.steampowered.com/app/570/Dota_2/"
    },
    {
      id:"pubg", title:"PUBG: Battlegrounds", genre:"Battle Royale", platform:"PC", rating:4.1,
      thumbnail:"https://cdn.akamai.steamstatic.com/steam/apps/578080/library_hero.jpg",
      game_url:"https://store.steampowered.com/app/578080/PUBG_BATTLEGROUNDS/"
    },
    {
      id:"sts2", title:"Slay the Spire 2", genre:"Roguelike", platform:"PC", rating:4.9,
      thumbnail:"https://cdn.akamai.steamstatic.com/steam/apps/2868840/library_hero.jpg",
      game_url:"https://store.steampowered.com/app/2868840/Slay_the_Spire_2/"
    },
    {
      id:"bg3", title:"Baldur's Gate 3", genre:"RPG", platform:"PC", rating:4.9,
      thumbnail:"https://cdn.akamai.steamstatic.com/steam/apps/1086940/library_hero.jpg",
      game_url:"https://store.steampowered.com/app/1086940/Baldurs_Gate_3/"
    },
    {
      id:"apex", title:"Apex Legends", genre:"Battle Royale", platform:"PC", rating:4.3,
      thumbnail:"https://cdn.akamai.steamstatic.com/steam/apps/1172470/library_hero.jpg",
      game_url:"https://store.steampowered.com/app/1172470/Apex_Legends/"
    },
    {
      id:"poe2", title:"Path of Exile 2", genre:"Action RPG", platform:"PC", rating:4.5,
      thumbnail:"https://cdn.akamai.steamstatic.com/steam/apps/2694490/library_hero.jpg",
      game_url:"https://store.steampowered.com/app/2694490/Path_of_Exile_2/"
    },
  ];

  return (
    <div className="neon-card p-3 glow h-100">
      <SectionTitle
        icon="bi-bar-chart-fill"
        title="Népszerű Játékok"
        subtitle="Legjobb értékelésű PC játékok — kattints a részletekért"
        action={
          <a href="#/games" className="btn btn-neon btn-sm">
            <i className="bi bi-grid me-1"></i>Összes
          </a>
        }
      />
      {/* {err && <div className="alert alert-danger py-2">{err}</div>} */}

      <div id="topCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="2500">
        <div className="carousel-inner" style={{borderRadius:12, overflow:"hidden"}}>
          {FEATURED_GAMES.map((g, idx) => (
            <div key={g.id} className={`carousel-item ${idx===0 ? "active":""}`}>
              <div style={{position:"relative"}}>
                <div className="ratio ratio-16x9">
                  <img
                    src={g.thumbnail || "https://placehold.co/640x360/070d1a/37b6ff?text=No+Image"}
                    className="w-100 h-100"
                    style={{objectFit:"cover"}}
                    alt={g.title}
                    loading="lazy"
                  />
                </div>
                {/* Overlay gradient */}
                <div style={{
                  position:"absolute", inset:0,
                  background:"linear-gradient(0deg, rgba(3,6,8,.92) 0%, rgba(3,6,8,.3) 50%, transparent 100%)"
                }}>
                </div>
                {/* Caption */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  padding:"1rem 1.25rem"
                }}>
                  <div className="d-flex align-items-end justify-content-between">
                    <div>
                      <div className="d-flex gap-2 mb-1 flex-wrap">
                        {g.genre && <span className="pill" style={{fontSize:"0.58rem"}}>{g.genre}</span>}
                        {g.platform && <span className="pill" style={{
                          fontSize:"0.58rem",
                          borderColor:"rgba(0,229,160,.3)", color:"var(--neon3)",
                          background:"rgba(0,229,160,.08)"
                        }}>{g.platform}</span>}
                        {g.rating && <span className="pill" style={{
                          fontSize:"0.58rem",
                          borderColor:"rgba(255,193,7,.4)", color:"#ffc107",
                          background:"rgba(255,193,7,.1)"
                        }}>⭐ {Number(g.rating).toFixed(1)}</span>}
                      </div>
                      <h5 style={{
                        fontFamily:"Orbitron, monospace",
                        fontSize:"0.9rem", fontWeight:700,
                        color:"var(--text)", margin:0,
                        textShadow:"0 2px 8px rgba(0,0,0,.8)"
                      }}>
                        {g.title}
                      </h5>
                    </div>
                    <a
                      href={`#/games?pick=${g.id}`}
                      className="btn btn-neon btn-sm flex-shrink-0"
                      style={{fontSize:"0.75rem"}}
                    >
                      <i className="bi bi-info-circle me-1"></i>Részletek
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="carousel-indicators" style={{marginBottom:"3.5rem"}}>
          {FEATURED_GAMES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-bs-target="#topCarousel"
              data-bs-slide-to={idx}
              className={idx===0 ? "active" : ""}
              style={{width:6, height:6, borderRadius:"50%", margin:"0 3px"}}
            />
          ))}
        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#topCarousel" data-bs-slide="prev"
          style={{width:40, height:40, top:"45%", left:8}}>
          <span className="carousel-control-prev-icon" style={{width:18, height:18}}></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#topCarousel" data-bs-slide="next"
          style={{width:40, height:40, top:"45%", right:8}}>
          <span className="carousel-control-next-icon" style={{width:18, height:18}}></span>
        </button>
      </div>
    </div>
  );
};

/* ───────────────────────────────────────
   NewsPanel
─────────────────────────────────────── */
window.NGH.components.NewsPanel = function NewsPanel(){
  const [news, setNews] = useState([]);
  const [err, setErr] = useState("");
  const api = window.NGH.lib.api;
  const formatDate = window.NGH.lib.formatDate;
  const SectionTitle = window.NGH.components.SectionTitle;

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const data = await api("/api/news?limit=20");
        setNews(data.items || []);
      } catch (e) { setErr(e.message || "Hiba"); }
    })();
  }, []);

  // Source color mapping
  const sourceColors = {
    "IGN":                "rgba(255,80,0,.15)",
    "PC Gamer":           "rgba(55,182,255,.12)",
    "GameSpot":           "rgba(0,229,160,.1)",
    "Eurogamer":          "rgba(184,75,255,.12)",
    "Rock Paper Shotgun": "rgba(255,193,7,.1)",
    "Polygon":            "rgba(255,61,113,.1)",
  };
  const sourceBorderColors = {
    "IGN":                "rgba(255,80,0,.35)",
    "PC Gamer":           "rgba(55,182,255,.3)",
    "GameSpot":           "rgba(0,229,160,.3)",
    "Eurogamer":          "rgba(184,75,255,.3)",
    "Rock Paper Shotgun": "rgba(255,193,7,.3)",
    "Polygon":            "rgba(255,61,113,.3)",
  };

  return (
    <div className="neon-card p-3 glow2 h-100">
      <SectionTitle
        icon="bi-newspaper"
        title="Friss hírek"
        subtitle="6 gaming RSS forrás"
        action={
          <a href="#/news" className="btn btn-neon btn-sm" style={{
            borderColor:"rgba(184,75,255,.35)",
            background:"rgba(184,75,255,.1)"
          }}>
            <i className="bi bi-arrow-right me-1"></i>Összes
          </a>
        }
      />

      {err && <div className="alert alert-danger py-2">{err}</div>}

      <div className="message-list vstack gap-2" style={{maxHeight:420, paddingRight:2}}>
        {news.length === 0 && !err && (
          <div className="text-center py-4">
            <div className="spinner-border text-info mb-2" style={{width:24, height:24, borderWidth:2}}></div>
            <div className="small-muted">Hírek betöltése...</div>
          </div>
        )}
        {news.map((n, i) => (
          <a key={i} className="text-decoration-none" href={n.link} target="_blank" rel="noreferrer">
            <div className="message-card" style={{
              background: sourceColors[n.source] || "rgba(11,21,37,.5)",
              borderColor: sourceBorderColors[n.source] || "rgba(55,182,255,.1)",
            }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="pill" style={{
                  fontSize:"0.58rem",
                  borderColor: sourceBorderColors[n.source] || "rgba(55,182,255,.25)",
                  color: n.source === "GameSpot" ? "var(--neon3)" :
                         n.source === "Eurogamer" ? "var(--neon2)" :
                         n.source === "Polygon" ? "var(--danger)" : "var(--neon)",
                  background: sourceColors[n.source] || "rgba(55,182,255,.1)",
                }}>
                  {n.source}
                </span>
                <span className="small-muted" style={{fontSize:"0.72rem"}}>
                  {n.pubDate ? formatDate(n.pubDate) : ""}
                </span>
              </div>
              <div style={{
                fontWeight:600, fontSize:"0.88rem", lineHeight:1.4,
                color:"var(--text)",
                display:"-webkit-box",
                WebkitLineClamp:2,
                WebkitBoxOrient:"vertical",
                overflow:"hidden"
              }}>
                {n.title}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};


/* ───────────────────────────────────────
   News oldal (#/news)
─────────────────────────────────────── */
window.NGH.pages = window.NGH.pages || {};

window.NGH.pages.News = function News(){
  const { useEffect, useState } = React;
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;
  const formatDate = window.NGH.lib.formatDate;

  const [limit, setLimit] = useState(100);
  const [pendingLimit, setPendingLimit] = useState(100);
  const [news, setNews] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [sourceSel, setSourceSel] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        const data = await api(`/api/news?limit=${limit}`);
        setNews(data.items || []);
      } catch (e) { setErr(e.message || "Hiba"); }
      setLoading(false);
    })();
  }, [limit]);

  const allSources = [...new Set(news.map(n => n.source))].filter(Boolean).sort();

  const filtered = news.filter(n => {
    const matchQ = !q.trim() || (n.title||"").toLowerCase().includes(q.trim().toLowerCase());
    const matchS = !sourceSel || n.source === sourceSel;
    return matchQ && matchS;
  });

  const LIMIT_OPTIONS = [50, 100, 150, 200, 250, 300];

  const sourceColors = {
    "IGN":"rgba(255,80,0,.15)","PC Gamer":"rgba(55,182,255,.12)","GameSpot":"rgba(0,229,160,.1)",
    "Eurogamer":"rgba(184,75,255,.12)","Rock Paper Shotgun":"rgba(255,193,7,.1)","Polygon":"rgba(255,61,113,.1)"
  };
  const sourceTextColors = {
    "IGN":"#ff5000","PC Gamer":"#37b6ff","GameSpot":"#00e5a0",
    "Eurogamer":"#b84bff","Rock Paper Shotgun":"#ffc107","Polygon":"#ff3d71"
  };

  return (
    <div>
      <SectionTitle icon="bi-newspaper" title="Friss hírek" subtitle="Összes hír, több forrásból (RSS aggregátor)"/>

      <div className="row g-3">
        {/* Sidebar */}
        <div className="col-lg-3">
          <div className="neon-card p-3 glow2">
            <div className="fw-semibold neon mb-3" style={{fontFamily:"Orbitron, monospace", fontSize:"0.82rem", letterSpacing:"0.06em"}}>
              <i className="bi bi-funnel me-2"></i>SZŰRŐK
            </div>

            <label className="form-label small-muted">Cím keresése</label>
            <input
              className="form-control mb-3"
              placeholder="Keresés a hírek között..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />

            <label className="form-label small-muted">Forrás</label>
            <select className="form-select mb-4" value={sourceSel} onChange={e => setSourceSel(e.target.value)}>
              <option value="">Összes forrás</option>
              {allSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Limit slider */}
            <div className="mb-1 d-flex justify-content-between align-items-center">
              <label className="form-label small-muted mb-0">Betöltendő hírek</label>
              <span className="neon fw-semibold" style={{fontFamily:"Orbitron,monospace",fontSize:"0.85rem"}}>{pendingLimit}</span>
            </div>
            <input
              type="range"
              className="form-range mb-2"
              min={50} max={300} step={50}
              value={pendingLimit}
              onChange={e => setPendingLimit(Number(e.target.value))}
            />
            <div className="d-flex justify-content-between small-muted mb-3" style={{fontSize:"0.68rem"}}>
              {LIMIT_OPTIONS.map(v => <span key={v}>{v}</span>)}
            </div>
            <button
              className="btn btn-neon w-100 mb-2"
              disabled={pendingLimit === limit}
              onClick={() => setLimit(pendingLimit)}
            >
              <i className="bi bi-download me-1"></i>Betöltés ({pendingLimit} hír)
            </button>
            <button
              className="btn btn-outline-light btn-sm w-100"
              onClick={() => { setPendingLimit(100); setLimit(100); setQ(""); setSourceSel(""); }}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
            </button>

            <div className="small-muted mt-3" style={{fontSize:"0.75rem"}}>
              <i className="bi bi-info-circle me-1"></i>
              <b className="neon">{filtered.length}</b> megjelenítve · <b>{limit}</b> betöltve
            </div>
          </div>
        </div>

        {/* News list */}
        <div className="col-lg-9">
          {err && <div className="alert alert-danger">{err}</div>}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info mb-2" style={{width:32,height:32,borderWidth:3}}></div>
              <div className="small-muted">Hírek betöltése...</div>
            </div>
          ) : (
            <div className="neon-card p-3 glow message-list" style={{maxHeight:"78vh", overflowY:"auto"}}>
              <div className="vstack gap-2">
                {filtered.map((n, i) => (
                  <a key={i} className="text-decoration-none" href={n.link} target="_blank" rel="noreferrer">
                    <div className="message-card d-flex gap-3 align-items-start" style={{
                      background: sourceColors[n.source] || "rgba(11,21,37,.5)",
                      transition:"transform .12s, border-color .12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateX(3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="translateX(0)"; }}
                    >
                      <div style={{flexShrink:0, paddingTop:2}}>
                        <span className="pill" style={{
                          fontSize:"0.6rem", whiteSpace:"nowrap",
                          color: sourceTextColors[n.source] || "var(--neon)",
                        }}>{n.source}</span>
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{
                          fontWeight:600, fontSize:"0.92rem", lineHeight:1.45,
                          color:"var(--text)", marginBottom:"0.2rem",
                          overflow:"hidden", textOverflow:"ellipsis",
                          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical"
                        }}>
                          {n.title}
                        </div>
                      </div>
                      <div className="small-muted flex-shrink-0" style={{fontSize:"0.75rem", paddingTop:2}}>
                        {n.pubDate ? formatDate(n.pubDate) : ""}
                      </div>
                    </div>
                  </a>
                ))}
                {filtered.length === 0 && !loading && (
                  <div className="text-center py-5 small-muted">
                    <i className="bi bi-search fs-3 d-block mb-2"></i>
                    Nincs találat
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};