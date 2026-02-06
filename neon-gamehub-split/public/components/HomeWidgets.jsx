/**
 * components/HomeWidgets.jsx
 * --------------------------
 * Home oldali widgetek:
 * - TopGamesCarousel (slider)
 * - NewsPanel (RSS hírek)
 */
window.NGH = window.NGH || {};
window.NGH.components = window.NGH.components || {};

const { useEffect, useState } = React;

window.NGH.components.TopGamesCarousel = function TopGamesCarousel(){
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const api = window.NGH.lib.api;

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const data = await api("/api/games?platform=pc&sort-by=popularity");
        setItems(data.slice(0, 8));
      } catch (e) { setErr(e.message || "Hiba"); }
    })();
  }, []);

  const SectionTitle = window.NGH.components.SectionTitle;

  return (
    <div className="neon-card p-3 glow">
      <SectionTitle icon="bi-fire" title="Top játékok slider" subtitle="A FreeToGame API népszerű PC játékai (top 8)"/>
      {err && <div className="alert alert-danger">{err}</div>}

      <div id="topCarousel" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner rounded-4">
          {items.map((g, idx) => (
            <div key={g.id} className={`carousel-item ${idx===0 ? "active":""}`}>
              <div className="ratio ratio-16x9">
                <img src={g.thumbnail} className="w-100 h-100 object-fit-cover" alt={g.title}/>
              </div>
              <div className="carousel-caption text-start">
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#topCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#topCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon"></span>
        </button>
      </div>
    </div>
  );
};

window.NGH.components.NewsPanel = function NewsPanel(){
  const [news, setNews] = useState([]);
  const [err, setErr] = useState("");
  const api = window.NGH.lib.api;
  const formatDate = window.NGH.lib.formatDate;

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const data = await api("/api/news?limit=18");
        setNews(data.items || []);
      } catch (e) { setErr(e.message || "Hiba"); }
    })();
  }, []);

  const SectionTitle = window.NGH.components.SectionTitle;

  return (
    <div className="neon-card p-3 glow2">
      <SectionTitle icon="bi-newspaper" title="Friss hírek" subtitle="RSS aggregator: PC Gamer, IGN, GameSpot, Game Rant, Esport1"/>
      {err && <div className="alert alert-danger">{err}</div>}
      <div className="vstack gap-2" style={{maxHeight: 430, overflow:"auto"}}>
        {news.map((n, i) => (
          <a key={i} className="text-decoration-none" href={n.link} target="_blank" rel="noreferrer">
            <div className="neon-card p-2">
              <div className="d-flex justify-content-between">
                <span className="pill">{n.source}</span>
                <span className="small-muted">{n.pubDate ? formatDate(n.pubDate) : ""}</span>
              </div>
              <div className="fw-semibold mt-1">{n.title}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};


/**
 * News oldal (külön route: #/news)
 * - Sokkal több hír, saját oldal görgetéssel
 * - A főoldali NewsPanel marad (limit=18)
 */
window.NGH.pages = window.NGH.pages || {};

window.NGH.pages.News = function News(){
  const { useEffect, useState } = React;
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;
  const formatDate = window.NGH.lib.formatDate;

  const [limit, setLimit] = useState(60);
  const [news, setNews] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const data = await api(`/api/news?limit=${limit}`);
        setNews(data.items || []);
      } catch (e) { setErr(e.message || "Hiba"); }
    })();
  }, [limit]);
  return (
    <div>
      <SectionTitle icon="bi-newspaper" title="Friss hírek — összes" subtitle="Sok hír, görgethető lista, több forrásból (RSS)"/>
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="neon-card p-3 glow2">
            <div className="fw-semibold neon mb-2"><i className="bi bi-search me-2"></i>Szűrés</div>
            <input className="form-control" placeholder="Keresés címben..." value={q} onChange={e=>setQ(e.target.value)} />
            <div className="small-muted mt-2">
              Limit: <b className="neon">{limit}</b>
            </div>
            <div className="d-flex gap-2 mt-2 flex-wrap">
              <button className="btn btn-neon btn-sm" onClick={()=>setLimit(Math.min(limit+30, 120))}>
                <i className="bi bi-plus-circle me-1"></i>Több hír
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={()=>{setLimit(60); setQ("");}}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            </div>
            <div className="small-muted mt-3">
              Tipp: a főoldalon marad a válogatás, itt pedig az összes.
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {err && <div className="alert alert-danger">{err}</div>}
          <div className="neon-card p-3 glow message-list" style={{maxHeight: "70vh"}}>
            <div className="vstack gap-2">
              {news
                .filter(n => !q.trim() || (n.title||"").toLowerCase().includes(q.trim().toLowerCase()))
                .map((n, i) => (
                <a key={i} className="text-decoration-none" href={n.link} target="_blank" rel="noreferrer">
                  <div className="neon-card p-2 message-card">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <span className="pill">{n.source}</span>
                      <span className="small-muted">{n.pubDate ? formatDate(n.pubDate) : ""}</span>
                    </div>
                    <div className="fw-semibold mt-1">{n.title}</div>
                  </div>
                </a>
              ))}
              {news.length === 0 && <div className="small-muted">Nincs hír.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
