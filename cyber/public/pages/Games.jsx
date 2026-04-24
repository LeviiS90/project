/**
 * pages/Games.jsx
 * – Szerver-oldali lapozás → teljes RAWG katalógus (~500k játék)
 * – Kedvencek modal, 4 per sor, 12 per oldal
 * – Kedvencek userenként elkülönítve (fav_<userId> kulcs)
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};
const { useEffect, useState, useRef } = React;

const PAGE_SIZE = 12;

window.NGH.pages.Games = function Games({ auth }){
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;

  const [platforms, setPlatforms] = useState(["pc"]);
  const [genresSel, setGenresSel] = useState([]);
  const [sortBy, setSortBy]       = useState("popularity");
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState(""); // live input, submit on Enter/button
  const [items, setItems]         = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [fav, setFav]             = useState(() => {
    const k = auth?.user?.id ? `fav_${auth.user.id}` : null;
    return k ? JSON.parse(localStorage.getItem(k) || "[]") : [];
  });
  const [err, setErr]             = useState("");
  const [selected, setSelected]   = useState(null);
  const [detailsErr, setDetailsErr] = useState("");
  const [page, setPage]           = useState(1);
  const [showFavModal, setShowFavModal] = useState(false);
  const debounceRef = useRef(null);

  // Kedvencek újratöltése ha a user megváltozik (be/kijelentkezés)
  useEffect(() => {
    const k = auth?.user?.id ? `fav_${auth.user.id}` : null;
    setFav(k ? JSON.parse(localStorage.getItem(k) || "[]") : []);
  }, [auth?.user?.id]);

  const genres = ["mmorpg","shooter","strategy","moba","racing","sports","social",
    "sandbox","open-world","survival","pvp","pve","pixel","anime","fantasy",
    "sci-fi","fighting","action-rpg","battle-royale"];

  const orderingMap = {
    popularity: "-added",
    "release-date": "-released",
    alphabetical: "name",
    relevance: "-relevance",
    rating: "-rating",
  };

  // Fetch a page from server (paged mode)
  async function fetchPage(pg, plats, genres, sort, q) {
    setLoading(true); setErr("");
    try {
      const platformParam = plats.length === 0 ? "all"
        : plats.length === 1 ? plats[0] : "all";
      const qs = new URLSearchParams();
      qs.set("page", String(pg));
      qs.set("page_size", String(PAGE_SIZE));
      qs.set("platform", platformParam);
      qs.set("ordering", orderingMap[sort] || "-added");
      if (q.trim()) qs.set("search", q.trim());
      if (genres.length > 0) qs.set("genres", genres.join(","));

      const res = await api(`/api/games?${qs.toString()}`);
      if (res && res.results) {
        setItems(res.results);
        setTotalCount(res.count || 0);
      } else {
        setItems([]);
        setTotalCount(0);
      }
    } catch(e) { setErr(e.message || "Hiba"); }
    setLoading(false);
  }

  // URL query: #/games?pick=ID
  useEffect(() => {
    const q = new URLSearchParams(location.hash.split("?")[1] || "");
    const pick = q.get("pick");
    if (pick) loadDetails(pick);
  }, []);

  // Fetch on filter/page change
  useEffect(() => {
    fetchPage(page, platforms, genresSel, sortBy, search);
  }, [page, platforms, genresSel, sortBy, search]);

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  function doSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function toggleFav(game){
    // Bejelentkezés szükséges
    if (!auth?.user) {
      if (window.NGH?.toast) window.NGH.toast("❗ Kedvencekhez adáshoz be kell jelentkezni!", { position: "br" });
      return;
    }
    const k = `fav_${auth.user.id}`;
    const isFav = fav.some(x => x.id === game.id);
    const next = isFav
      ? fav.filter(x => x.id !== game.id)
      : [...fav, { id: game.id, title: game.title, thumbnail: game.thumbnail }];
    setFav(next);
    localStorage.setItem(k, JSON.stringify(next));
    // Értesítjük a CommunityPulse widgetet
    window.dispatchEvent(new Event("favchange"));
    if (window.NGH?.toast) {
      window.NGH.toast(
        isFav ? `❌ ${game.title} eltávolítva` : `❤️ ${game.title} kedvencekhez adva!`,
        { position: "br" }
      );
    }
  }

  async function loadDetails(id){
    setDetailsErr(""); setSelected(null);
    try { setSelected(await api(`/api/games/${id}`)); }
    catch(e) { setDetailsErr(e.message || "Hiba"); }
  }

  function closeModal(){ setSelected(null); }

  function Pagination(){
    if (totalPages <= 1) return null;

    const jumpRef = useRef(null);

    const show = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]
      .filter(p => p >= 1 && p <= totalPages));
    const sorted = [...show].sort((a,b) => a-b);

    const btnBase = {
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      minWidth:38, height:36, padding:"0 12px",
      border:"1px solid rgba(55,182,255,.18)",
      borderRadius:8,
      fontFamily:"Orbitron, monospace", fontSize:"0.8rem",
      transition:"all .15s", outline:"none", cursor:"pointer",
    };

    const btnStyle = (active, disabled) => ({
      ...btnBase,
      background: active ? "rgba(55,182,255,.22)" : disabled ? "rgba(255,255,255,.02)" : "rgba(255,255,255,.05)",
      borderColor: active ? "rgba(55,182,255,.6)" : "rgba(55,182,255,.15)",
      color: active ? "var(--neon)" : disabled ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.5)",
      fontWeight: active ? 700 : 400,
      cursor: disabled ? "default" : "pointer",
      boxShadow: active ? "0 0 10px rgba(55,182,255,.2)" : "none",
    });

    function doJump() {
      const n = parseInt(jumpRef.current?.value || "");
      if (!isNaN(n) && n >= 1 && n <= totalPages) {
        if (jumpRef.current) jumpRef.current.value = "";
        setPage(n); window.scrollTo(0,0);
      }
    }

    return (
      <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginTop:24}}>
        <div style={{display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", justifyContent:"center"}}>
          <button style={btnStyle(false, page===1)} disabled={page===1}
            onClick={() => { setPage(p=>p-1); window.scrollTo(0,0); }}>«</button>

          {sorted.map((p, i) => {
            const prev = sorted[i-1];
            return (
              <React.Fragment key={p}>
                {prev && p-prev > 1 && (
                  <span style={{
                    ...btnBase, background:"transparent", border:"none",
                    color:"rgba(55,182,255,.3)", fontSize:"0.9rem", cursor:"default", minWidth:24, padding:0,
                  }}>···</span>
                )}
                <button
                  style={btnStyle(page===p, false)}
                  onMouseEnter={e => { if(page!==p){ e.currentTarget.style.background="rgba(55,182,255,.1)"; e.currentTarget.style.borderColor="rgba(55,182,255,.35)"; }}}
                  onMouseLeave={e => { if(page!==p){ e.currentTarget.style.background="rgba(255,255,255,.05)"; e.currentTarget.style.borderColor="rgba(55,182,255,.15)"; }}}
                  onClick={() => { setPage(p); window.scrollTo(0,0); }}
                >{p}</button>
              </React.Fragment>
            );
          })}

          <button style={btnStyle(false, page===totalPages)} disabled={page===totalPages}
            onClick={() => { setPage(p=>p+1); window.scrollTo(0,0); }}>»</button>
        </div>

        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{fontFamily:"Orbitron,monospace", fontSize:"0.65rem", color:"rgba(55,182,255,.4)", letterSpacing:"0.1em"}}>
            UGRÁS
          </span>
          <input
            ref={jumpRef}
            type="number" min={1} max={totalPages}
            onKeyDown={e => e.key==="Enter" && doJump()}
            placeholder={`1 – ${totalPages.toLocaleString()}`}
            style={{
              width:110, height:32, textAlign:"center",
              background:"rgba(55,182,255,.06)",
              border:"1px solid rgba(55,182,255,.25)",
              borderRadius:7, color:"var(--neon)",
              fontFamily:"Orbitron,monospace", fontSize:"0.72rem",
              outline:"none",
              MozAppearance:"textfield",
            }}
          />
          <button onClick={doJump} style={{
            height:32, padding:"0 14px",
            background:"rgba(55,182,255,.14)",
            border:"1px solid rgba(55,182,255,.35)",
            borderRadius:7, color:"var(--neon)",
            fontFamily:"Orbitron,monospace", fontSize:"0.72rem",
            cursor:"pointer", transition:"background .15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(55,182,255,.25)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(55,182,255,.14)"}
          >→</button>
          <span style={{fontFamily:"Orbitron,monospace", fontSize:"0.6rem", color:"rgba(255,255,255,.2)"}}>
            / {totalPages.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle icon="bi-grid-3x3-gap" title="Játékok"
        subtitle={`Szűrők · Lapozás · Kedvencek${totalCount > 0 ? ` · ${totalCount.toLocaleString()} játék a RAWG-on` : ""}`}/>

      <div className="row g-3">
        {/* ── Sidebar ── */}
        <div className="col-lg-3">
          <div className="neon-card p-3 glow">
            <div className="fw-semibold neon mb-2"><i className="bi bi-funnel me-2"></i>Szűrők</div>

            <label className="small-muted mb-1">Platform (több választható)</label>
            <div className="neon-card p-2 mb-3 filter-box">
              {["pc","console"].map(p => (
                <div className="form-check" key={p}>
                  <input className="form-check-input" type="checkbox" id={`p_${p}`}
                    checked={platforms.includes(p)}
                    onChange={() => {
                      const next = platforms.includes(p) ? platforms.filter(x=>x!==p) : [...platforms, p];
                      setPlatforms(next); setPage(1);
                    }}/>
                  <label className="form-check-label small-muted" htmlFor={`p_${p}`}>{p.toUpperCase()}</label>
                </div>
              ))}
              <div className="small-muted mt-2">Több jelölve → API: <b>all</b></div>
            </div>

            <label className="small-muted mb-1">Genre</label>
            <div className="neon-card p-2 mb-3 filter-box">
              {genres.map(g => (
                <div className="form-check" key={g}>
                  <input className="form-check-input" type="checkbox" id={`g_${g}`}
                    checked={genresSel.includes(g)}
                    onChange={() => {
                      const next = genresSel.includes(g) ? genresSel.filter(x=>x!==g) : [...genresSel, g];
                      setGenresSel(next); setPage(1);
                    }}/>
                  <label className="form-check-label small-muted" htmlFor={`g_${g}`}>{g}</label>
                </div>
              ))}
            </div>

            <label className="small-muted mb-1">Rendezés</label>
            <select className="form-select mb-3" value={sortBy}
              onChange={e=>{ setSortBy(e.target.value); setPage(1); }}>
              <option value="popularity">Népszerűség</option>
              <option value="release-date">Megjelenési dátum</option>
              <option value="alphabetical">ABC szerint</option>
              <option value="rating">Értékelés</option>
            </select>

            <button className="btn btn-neon w-100" onClick={() => setShowFavModal(true)}>
              <i className="bi bi-heart-fill me-2" style={{color:"#ff3d71"}}></i>Kedvencek
              {auth?.user && fav.length > 0 && (
                <span className="ms-2 badge" style={{
                  background:"rgba(255,61,113,.25)", border:"1px solid rgba(255,61,113,.4)",
                  color:"#ff3d71", fontSize:"0.7rem", borderRadius:10
                }}>{fav.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="col-lg-9">
          {err && <div className="alert alert-danger">{err}</div>}
          {detailsErr && <div className="alert alert-warning">{detailsErr}</div>}

          {/* Search bar */}
          <div className="neon-card p-3 glow mb-3">
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <div className="fw-semibold neon"><i className="bi bi-search me-2"></i>Keresés név alapján</div>
              <div className="small-muted">
                {totalCount > 0 && <><b className="neon">{totalCount.toLocaleString()}</b> játék · </>}
                Oldal: <b className="neon">{page}/{totalPages}</b>
              </div>
            </div>
            <div className="d-flex gap-2 mt-2">
              <input className="form-control" placeholder="Pl. Cyberpunk, Elden Ring..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}/>
              <button className="btn btn-neon btn-sm" onClick={doSearch}>
                <i className="bi bi-search"></i>
              </button>
              {search && (
                <button className="btn btn-outline-light btn-sm"
                  onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
            <div className="small-muted mt-1" style={{fontSize:"0.78rem"}}>
              Keresés az RAWG teljes adatbázisában · Enter vagy 🔍 gomb
            </div>
          </div>

          {/* Game cards */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info mb-2" style={{width:36,height:36,borderWidth:3}}></div>
              <div className="small-muted">Játékok betöltése...</div>
            </div>
          ) : (
            <div className="row g-3">
              {items.map(g => (
                <div key={g.id} className="col-sm-6 col-lg-3">
                  <div className="neon-card h-100">
                    <img src={g.thumbnail || "https://placehold.co/320x180/070d1a/37b6ff?text=No+Image"}
                      className="card-img-top" alt={g.title} style={{height:140,objectFit:"cover"}}/>
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <div className="fw-semibold neon" style={{
                          fontSize:"0.88rem", lineHeight:1.3,
                          display:"-webkit-box", WebkitLineClamp:2,
                          WebkitBoxOrient:"vertical", overflow:"hidden"
                        }}>{g.title}</div>
                        {g.genre && <span className="pill" style={{flexShrink:0,fontSize:"0.58rem"}}>{g.genre}</span>}
                      </div>
                      {g.rating > 0 && (
                        <div className="small-muted mb-1" style={{fontSize:"0.76rem"}}>
                          ⭐ {Number(g.rating).toFixed(1)} · {g.release_date?.slice(0,4)||""}
                        </div>
                      )}
                      {(g.developer || g.publisher) && (
                        <div className="small-muted mb-1" style={{
                          fontSize:"0.72rem",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                          color:"rgba(55,182,255,.55)"
                        }}>
                          🎮 {g.developer || g.publisher}
                        </div>
                      )}
                      {g.short_description && !(g.short_description === (g.title||"").toLowerCase().replace(/\s/g,"-")) && (
                        <div className="small-muted mb-1" style={{
                          fontSize:"0.71rem", lineHeight:1.4,
                          display:"-webkit-box", WebkitLineClamp:2,
                          WebkitBoxOrient:"vertical", overflow:"hidden"
                        }}>
                          {g.short_description}
                        </div>
                      )}
                      <div className="d-flex gap-2 mt-2">
                        <button className="btn btn-neon btn-sm flex-grow-1" onClick={() => loadDetails(g.id)}>
                          <i className="bi bi-search me-1"></i>Részletek
                        </button>
                        <button
                          className="btn btn-sm"
                          title={fav.some(x=>x.id===g.id) ? "Eltávolítás a kedvencekből" : "Kedvencekhez adás"}
                          onClick={() => toggleFav(g)}
                          style={{
                            background: fav.some(x=>x.id===g.id) ? "rgba(255,61,113,.18)" : "rgba(255,255,255,.06)",
                            border: fav.some(x=>x.id===g.id) ? "1px solid rgba(255,61,113,.45)" : "1px solid rgba(255,255,255,.18)",
                            borderRadius: 8, color: fav.some(x=>x.id===g.id) ? "#ff3d71" : "var(--muted)",
                            transition: "all .2s",
                          }}
                        >
                          <i className={`bi ${fav.some(x=>x.id===g.id) ? "bi-heart-fill" : "bi-heart"}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && !loading && (
                <div className="col-12 text-center py-5 small-muted">
                  <i className="bi bi-search fs-2 d-block mb-2"></i>
                  Nincs találat a keresésre.
                </div>
              )}
            </div>
          )}

          <Pagination />
        </div>
      </div>

      {/* ── Részletek modal ── */}
      {selected && (
        <div onClick={closeModal} style={{
          position:"fixed",inset:0,zIndex:1050,background:"rgba(0,0,0,.78)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"#0b1525",border:"1px solid rgba(55,182,255,.28)",
            borderRadius:16,maxWidth:720,width:"100%",maxHeight:"90vh",overflowY:"auto",
            boxShadow:"0 0 48px rgba(55,182,255,.18)",
          }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"1rem 1.25rem",borderBottom:"1px solid rgba(55,182,255,.12)"}}>
              <h5 className="neon mb-0" style={{fontFamily:"Orbitron, monospace",fontSize:"1rem"}}>{selected.title}</h5>
              <button onClick={closeModal} style={{
                background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",
                borderRadius:8,cursor:"pointer",color:"#ccc",fontSize:"1.5rem",lineHeight:1,
                width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",
              }}>×</button>
            </div>
            <div style={{padding:"1.25rem"}}>
              <div className="row g-3">
                <div className="col-md-6">
                  <img src={selected.thumbnail||selected.background_image||"https://placehold.co/640x360"} className="w-100 rounded-4 glow" alt={selected.title}/>
                  {selected.game_url && (
                    <a className="btn btn-neon w-100 mt-3" href={selected.game_url} target="_blank" rel="noreferrer">
                      <i className="bi bi-box-arrow-up-right me-2"></i>Hivatalos oldal
                    </a>
                  )}
                </div>
                <div className="col-md-6">
                  <div className="pill me-2 d-inline-block">{selected.genre || (selected.genres?.[0]?.name)}</div>
                  <div className="pill d-inline-block">{selected.platform}</div>
                  <div className="mt-2 small-muted">{selected.short_description||selected.description_raw?.slice(0,200)}</div>
                  <hr className="border-secondary"/>
                  <div className="small-muted">
                    <div><b>Developer:</b> {selected.developer || selected.developers?.[0]?.name}</div>
                    <div><b>Publisher:</b> {selected.publisher || selected.publishers?.[0]?.name}</div>
                    <div><b>Release:</b> {selected.release_date || selected.released}</div>
                    <div><b>Rating:</b> {selected.rating ? `⭐ ${selected.rating}` : "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Kedvencek modal ── */}
      {showFavModal && (
        <div onClick={()=>setShowFavModal(false)} style={{
          position:"fixed",inset:0,zIndex:1060,background:"rgba(0,0,0,.78)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"#0b1525",border:"1px solid rgba(255,61,113,.28)",
            borderRadius:16,maxWidth:680,width:"100%",maxHeight:"85vh",overflowY:"auto",
            boxShadow:"0 0 48px rgba(255,61,113,.15)",
          }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"1rem 1.25rem",borderBottom:"1px solid rgba(255,61,113,.15)"}}>
              <h5 className="mb-0" style={{fontFamily:"Orbitron,monospace",fontSize:"1rem",color:"#ff3d71"}}>
                <i className="bi bi-heart-fill me-2"></i>Kedvencek
                <span className="ms-2" style={{fontSize:"0.8rem",color:"var(--muted)"}}>({fav.length} játék)</span>
              </h5>
              <button onClick={()=>setShowFavModal(false)} style={{
                background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",
                borderRadius:8,cursor:"pointer",color:"#ccc",fontSize:"1.5rem",lineHeight:1,
                width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",
              }}>×</button>
            </div>
            <div style={{padding:"1rem 1.25rem"}}>
              {!auth?.user ? (
                <div className="text-center py-5 small-muted">
                  <i className="bi bi-lock fs-2 d-block mb-2"></i>
                  Kedvencek megtekintéséhez be kell jelentkezni.
                </div>
              ) : fav.length === 0 ? (
                <div className="text-center py-5 small-muted">
                  <i className="bi bi-heart fs-2 d-block mb-2"></i>Még nincs kedvenc játék.
                </div>
              ) : (
                <div className="row g-3">
                  {fav.map(f => (
                    <div key={f.id} className="col-sm-6 col-md-4">
                      <div className="neon-card p-2 h-100" style={{cursor:"pointer"}}
                        onClick={()=>{ setShowFavModal(false); loadDetails(f.id); }}>
                        <img src={f.thumbnail} className="w-100 rounded-3 mb-2"
                          style={{height:90,objectFit:"cover"}} alt={f.title}/>
                        <div className="d-flex align-items-center justify-content-between gap-1">
                          <div className="small fw-semibold neon" style={{
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"
                          }}>{f.title}</div>
                          <button className="btn btn-sm p-0"
                            style={{color:"#ff3d71",flexShrink:0,background:"none",border:"none"}}
                            onClick={e=>{e.stopPropagation();toggleFav(f);}}>
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
