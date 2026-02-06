/**
 * pages/Games.jsx
 * --------------
 * Játékok oldal:
 * - Bal oldali szűrők (platform, genre, sort)
 * - Jobbra kártyák + "kedvencekhez" (localStorage)
 * - Részletes játék modal (GET /api/games/:id)
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

const { useEffect, useState } = React;

window.NGH.pages.Games = function Games(){
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;

  const [platforms, setPlatforms] = useState(["pc"]); // lehet több
  const [genresSel, setGenresSel] = useState([]); // lehet több
  const [sortBy, setSortBy] = useState("popularity");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [fav, setFav] = useState(() => JSON.parse(localStorage.getItem("fav") || "[]"));
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailsErr, setDetailsErr] = useState("");

  const genres = ["mmorpg","shooter","strategy","moba","racing","sports","social","sandbox","open-world","survival","pvp","pve","pixel","anime","fantasy","sci-fi","fighting","action-rpg","battle-royale"];

  // URL query: #/games?pick=ID (a slider "Részletek" gombja)
  useEffect(() => {
    const q = new URLSearchParams(location.hash.split("?")[1] || "");
    const pick = q.get("pick");
    if (pick) loadDetails(pick);
  }, []);

  
useEffect(() => {
  (async () => {
    setErr("");
    setSelected(null);
    try {
      const qp = new URLSearchParams();
      // FreeToGame API csak 1 platformot fogad, ezért:
      // - ha több platform van bejelölve, platform=all
      const platformParam = platforms.length === 0 ? "all" : (platforms.length === 1 ? platforms[0] : "all");
      qp.set("platform", platformParam);
      if (sortBy) qp.set("sort-by", sortBy);

      const data = await api(`/api/games?${qp.toString()}`);

      // Több-genre szűrés kliens oldalon (a FreeToGame API egyszerre csak 1 category-t támogat)
      const filtered = (genresSel.length === 0)
        ? data
        : data.filter(g => genresSel.includes(String(g.genre || "").toLowerCase()));

      setItems(filtered.slice(0, 36));
    } catch (e) { setErr(e.message || "Hiba"); }
  })();
}, [platforms, genresSel, sortBy]);

  const shown = items.filter(g =>
    !search.trim() || String(g.title || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  function toggleFav(game){
    const next = fav.some(x => x.id === game.id)
      ? fav.filter(x => x.id !== game.id)
      : [...fav, { id: game.id, title: game.title, thumbnail: game.thumbnail }];
    setFav(next);
    localStorage.setItem("fav", JSON.stringify(next));
  }

  async function loadDetails(id){
    setDetailsErr("");
    setSelected(null);
    try {
      const d = await api(`/api/games/${id}`);
      setSelected(d);
      setTimeout(() => {
        const modal = new bootstrap.Modal(document.getElementById("gameModal"));
        modal.show();
      }, 0);
    } catch (e) { setDetailsErr(e.message || "Hiba"); }
  }

  return (
    <div>
      <SectionTitle icon="bi-grid-3x3-gap" title="Játékok" subtitle="Bal oldali szűrők • Jobbra kártyák • Kedvencek"/>
      <div className="row g-3">
        <div className="col-lg-3">
          <div className="neon-card p-3 glow">
            <div className="fw-semibold neon mb-2"><i className="bi bi-funnel me-2"></i>Szűrők</div>

            <label className="small-muted mb-1">Platform (több választható)</label>
            <div className="neon-card p-2 mb-3 filter-box">
              {["pc","browser"].map(p => (
                <div className="form-check" key={p}>
                  <input className="form-check-input" type="checkbox" id={`p_${p}`}
                    checked={platforms.includes(p)}
                    onChange={() => {
                      const next = platforms.includes(p) ? platforms.filter(x=>x!==p) : [...platforms, p];
                      setPlatforms(next);
                    }}
                  />
                  <label className="form-check-label small-muted" htmlFor={`p_${p}`}>{p.toUpperCase()}</label>
                </div>
              ))}
              <div className="small-muted mt-2">Ha mindkettő be van jelölve → API: <b>all</b></div>
            </div>

            <label className="small-muted mb-1">Genre (több választható)</label>
            <div className="neon-card p-2 mb-3 filter-box">
              {genres.map(g => (
                <div className="form-check" key={g}>
                  <input className="form-check-input" type="checkbox" id={`g_${g}`}
                    checked={genresSel.includes(g)}
                    onChange={() => {
                      const next = genresSel.includes(g) ? genresSel.filter(x=>x!==g) : [...genresSel, g];
                      setGenresSel(next);
                    }}
                  />
                  <label className="form-check-label small-muted" htmlFor={`g_${g}`}>{g}</label>
                </div>
              ))}
            </div>

            <label className="small-muted mb-1">Rendezés</label>
            <select className="form-select mb-3" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="popularity">popularity</option>
              <option value="release-date">release-date</option>
              <option value="alphabetical">alphabetical</option>
              <option value="relevance">relevance</option>
            </select>

            <div className="small-muted">
              Kedvencek: <b className="neon">{fav.length}</b>
              {fav.length > 0 && (
                <div className="mt-2 vstack gap-2">
                  {fav.slice(0,6).map(f => (
                    <a key={f.id} className="neon-card p-2 text-decoration-none" href="#"
                       onClick={(e)=>{e.preventDefault(); loadDetails(f.id);}}>
                      <div className="d-flex gap-2 align-items-center">
                        <img src={f.thumbnail} width="52" height="36" className="rounded-3 object-fit-cover" />
                        <div className="small">{f.title}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {err && <div className="alert alert-danger">{err}</div>}
          {detailsErr && <div className="alert alert-warning">{detailsErr}</div>}

          <div className="neon-card p-3 glow mb-3">
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <div className="fw-semibold neon"><i className="bi bi-search me-2"></i>Keresés név alapján</div>
              <div className="small-muted">Találatok: <b className="neon">{shown.length}</b></div>
            </div>
            <input
              className="form-control mt-2"
              placeholder="Pl. Warframe, Destiny, ..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
            <div className="small-muted mt-2">A keresés a jelenleg betöltött (szűrt) listán fut.</div>
          </div>

          <div className="row g-3">
            {shown.map(g => (
              <div key={g.id} className="col-md-6 col-xl-4">
                <div className="neon-card h-100">
                  <img src={g.thumbnail} className="card-img-top" alt={g.title}/>
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold neon">{g.title}</div>
                        <div className="small-muted">{g.publisher} • {g.developer}</div>
                      </div>
                      <span className="pill">{g.genre}</span>
                    </div>
                    <div className="small-muted mt-2">{(g.short_description||"").slice(0, 110)}...</div>

                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-neon btn-sm" onClick={() => loadDetails(g.id)}>
                        <i className="bi bi-search me-1"></i>Részletek
                      </button>
                      <button className="btn btn-outline-light btn-sm" onClick={() => toggleFav(g)}>
                        <i className={`bi ${fav.some(x=>x.id===g.id) ? "bi-heart-fill text-danger" : "bi-heart" } me-1`}></i>
                        Kedvencekhez
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="modal fade" id="gameModal" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content text-bg-dark border border-secondary">
                <div className="modal-header">
                  <h5 className="modal-title neon">{selected?.title || "Részletek"}</h5>
                  <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body">
                  {!selected ? (
                    <div className="small-muted">Betöltés...</div>
                  ) : (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <img src={selected.thumbnail} className="w-100 rounded-4 glow" />
                        {selected.game_url && (
                          <a className="btn btn-neon w-100 mt-3" href={selected.game_url} target="_blank" rel="noreferrer">
                            <i className="bi bi-box-arrow-up-right me-2"></i>Hivatalos oldal
                          </a>
                        )}
                      </div>
                      <div className="col-md-6">
                        <div className="pill me-2 d-inline-block">{selected.genre}</div>
                        <div className="pill d-inline-block">{selected.platform}</div>
                        <div className="mt-2 small-muted">{selected.short_description}</div>
                        <hr className="border-secondary"/>
                        <div className="small-muted">
                          <div><b>Developer:</b> {selected.developer}</div>
                          <div><b>Publisher:</b> {selected.publisher}</div>
                          <div><b>Release:</b> {selected.release_date}</div>
                          <div><b>Status:</b> {selected.status}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
