/**
 * pages/GOTY.jsx
 * – Valódi TGA GOTY győztesek, szép kártya grid
 * – Admin szerkesztés megmarad
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

const { useEffect, useState } = React;

/* Kis összecsukható admin toolbar — csak admin usernek */
function GOTYAdminBar({ auth, adminForm, setAdminForm, onSave }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        className="btn btn-sm d-flex align-items-center gap-2"
        onClick={() => setOpen(o => !o)}
        style={{
          background: "rgba(192,96,255,.10)",
          border: "1px solid rgba(192,96,255,.30)",
          color: "#e8b4ff",
          fontSize: "0.75rem",
          letterSpacing: "0.06em",
          fontFamily: "Orbitron, monospace",
          borderRadius: 8,
          padding: "0.3rem 0.85rem"
        }}
      >
        <i className="bi bi-shield-lock-fill" style={{fontSize:"0.7rem"}}></i>
        ADMIN
        <i className={`bi bi-chevron-${open ? "up" : "down"}`} style={{fontSize:"0.6rem"}}></i>
      </button>

      {open && (
        <div className="mt-2 p-3" style={{
          background: "rgba(7,13,26,.85)",
          border: "1px solid rgba(192,96,255,.20)",
          borderRadius: 10,
        }}>
          <div className="small-muted mb-2" style={{fontSize:"0.72rem", letterSpacing:"0.05em"}}>
            <i className="bi bi-pencil-square me-1"></i>GOTY szerkesztés
          </div>
          <form className="row g-2" onSubmit={onSave}>
            <div className="col-md-2">
              <input className="form-control form-control-sm" type="number" placeholder="Év"
                value={adminForm.year}
                onChange={e => setAdminForm({...adminForm, year: Number(e.target.value)})} />
            </div>
            <div className="col-md-4">
              <input className="form-control form-control-sm" placeholder="Játék címe"
                value={adminForm.game}
                onChange={e => setAdminForm({...adminForm, game: e.target.value})} />
            </div>
            <div className="col-md-6">
              <input className="form-control form-control-sm" placeholder="Hivatalos link"
                value={adminForm.url}
                onChange={e => setAdminForm({...adminForm, url: e.target.value})} />
            </div>
            <div className="col-12">
              <input className="form-control form-control-sm" placeholder="Borítókép URL"
                value={adminForm.cover}
                onChange={e => setAdminForm({...adminForm, cover: e.target.value})} />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button className="btn btn-sm btn-neon" style={{fontSize:"0.78rem"}}>
                <i className="bi bi-save me-1"></i>Mentés
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

window.NGH.pages.GOTY = function GOTY({ auth }){
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;
  const [items, setItems]     = useState([]);
  const [err, setErr]         = useState("");
  const [adminForm, setAdminForm] = useState({ year: new Date().getFullYear(), game:"", url:"", cover:"" });
  const isAdmin = auth?.user?.role === "admin";

  async function load(){
    setErr("");
    try { setItems(await api("/api/goty")); }
    catch(e){ setErr(e.message || "Hiba"); }
  }

  useEffect(() => { load(); }, []);

  async function saveGOTY(e){
    e.preventDefault();
    try {
      await api("/api/goty", { method:"POST", token: auth.token, body: adminForm });
      await load();
      window.NGH.toast("Létrehozva / frissítve!", { position:"br" });
      setAdminForm(f => ({ ...f, game:"", url:"", cover:"" }));
    } catch(err){ alert(err.message); }
  }

  async function deleteGOTY(year){
    if (!window.confirm(`Biztosan törlöd a(z) ${year}-es GOTY bejegyzést?`)) return;
    try {
      await api(`/api/goty/${year}`, { method:"DELETE", token: auth.token });
      await load();
      window.NGH.toast(`${year} törölve!`, { position:"br" });
    } catch(err){ alert(err.message); }
  }

  function quickFill(g) {
    if (!isAdmin) return;
    setAdminForm({ year: g.year, game: g.game||"", url: g.url||"", cover: g.cover||"" });
    window.NGH.toast("Kitöltve a szerkesztőbe", { position:"br" });
  }

  const tba = (g) => !g.game || g.game.startsWith("TBA");

  // Gradient palettes per year (cycling)
  const palettes = [
    "linear-gradient(135deg,rgba(55,182,255,.18),rgba(184,75,255,.12))",
    "linear-gradient(135deg,rgba(184,75,255,.18),rgba(55,182,255,.1))",
    "linear-gradient(135deg,rgba(0,229,160,.15),rgba(55,182,255,.1))",
    "linear-gradient(135deg,rgba(255,193,7,.13),rgba(255,120,50,.1))",
    "linear-gradient(135deg,rgba(255,61,113,.13),rgba(184,75,255,.1))",
  ];

  return (
    <div>
      <SectionTitle
        icon="bi-trophy-fill"
        title="Az év játéka — The Game Awards"
        subtitle="Az elmúlt 10 év legjobb játékai • TGA győztesek"
      />
      {err && <div className="alert alert-danger">{err}</div>}

      {/* Admin toolbar — csak admin usernek látható */}
      {isAdmin && <GOTYAdminBar auth={auth} adminForm={adminForm} setAdminForm={setAdminForm} onSave={saveGOTY} />}

      {/* GOTY grid */}
      <div className="row g-4">
        {items.map((g, idx) => (
          <div key={g.year} className="col-sm-6 col-lg-4 col-xl-3">
            <div
              className="neon-card h-100"
              style={{
                background: palettes[idx % palettes.length],
                border: tba(g)
                  ? "1px solid rgba(255,255,255,.08)"
                  : "1px solid rgba(55,182,255,.22)",
                borderRadius: 16,
                overflow: "hidden",
                transition: "transform .2s, box-shadow .2s",
                cursor: tba(g) ? "default" : "pointer",
              }}
              onMouseEnter={e => { if(!tba(g)) e.currentTarget.style.transform="translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}
              onClick={() => {
                if (isAdmin) { quickFill(g); return; }
                if (!tba(g) && g.url) window.open(g.url, "_blank", "noreferrer");
              }}
            >
              {/* Cover image */}
              <div style={{ position:"relative", aspectRatio:"16/9", overflow:"hidden", background:"rgba(0,0,0,.3)" }}>
                {g.cover ? (
                  <img
                    src={g.cover}
                    alt={g.game}
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                    onError={e => { e.currentTarget.style.display="none"; e.currentTarget.nextSibling.style.display="flex"; }}
                  />
                ) : null}
                {/* Fallback / TBA placeholder */}
                <div style={{
                  display: g.cover ? "none" : "flex",
                  alignItems:"center", justifyContent:"center",
                  width:"100%", height:"100%", minHeight:120,
                  background:"rgba(55,182,255,.06)",
                  flexDirection:"column", gap:8,
                }}>
                  <i className="bi bi-hourglass-split" style={{fontSize:"2rem", color:"rgba(55,182,255,.4)"}}></i>
                  <span style={{color:"rgba(55,182,255,.5)", fontSize:"0.8rem"}}>Hamarosan</span>
                </div>

                {/* Year badge */}
                <div style={{
                  position:"absolute", top:10, left:10,
                  background:"rgba(0,0,0,.75)",
                  backdropFilter:"blur(6px)",
                  border:"1px solid rgba(255,193,7,.5)",
                  borderRadius:8, padding:"3px 10px",
                  fontFamily:"Orbitron, monospace",
                  fontSize:"0.75rem", color:"#ffc107",
                  fontWeight:700, letterSpacing:"0.05em",
                }}>
                  {g.year}
                </div>

                {/* TGA badge */}
                {!tba(g) && (
                  <div style={{
                    position:"absolute", top:10, right:10,
                    background:"rgba(255,193,7,.15)",
                    border:"1px solid rgba(255,193,7,.4)",
                    borderRadius:6, padding:"2px 8px",
                    fontSize:"0.6rem", color:"#ffc107",
                    fontWeight:600, letterSpacing:"0.06em",
                  }}>
                    🏆 TGA
                  </div>
                )}

                {/* Bottom gradient */}
                {!tba(g) && g.cover && (
                  <div style={{
                    position:"absolute", bottom:0, left:0, right:0, height:48,
                    background:"linear-gradient(0deg,rgba(0,0,0,.7) 0%,transparent 100%)"
                  }}></div>
                )}
              </div>

              {/* Card body */}
              <div style={{ padding:"1rem" }}>
                {tba(g) ? (
                  <>
                    <div style={{
                      fontFamily:"Orbitron, monospace", fontSize:"0.85rem",
                      color:"rgba(255,255,255,.35)", fontWeight:600, marginBottom:4
                    }}>
                      Az év játéka {g.year}
                    </div>
                    <div style={{ fontSize:"0.78rem", color:"rgba(55,182,255,.45)" }}>
                      Hamarosan kiderül…
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      fontFamily:"Orbitron, monospace",
                      fontSize:"0.82rem", fontWeight:700,
                      color:"var(--text)", lineHeight:1.35,
                      marginBottom:8,
                      display:"-webkit-box", WebkitLineClamp:2,
                      WebkitBoxOrient:"vertical", overflow:"hidden"
                    }}>
                      {g.game}
                    </div>
                    {isAdmin ? (
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-outline-light btn-sm flex-grow-1"
                          style={{fontSize:"0.7rem"}}
                          onClick={e => { e.stopPropagation(); quickFill(g); }}
                        >
                          <i className="bi bi-pencil me-1"></i>Szerkesztés
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{fontSize:"0.7rem", background:"rgba(255,61,113,.15)", border:"1px solid rgba(255,61,113,.35)", color:"#ff3d71"}}
                          onClick={e => { e.stopPropagation(); deleteGOTY(g.year); }}
                          title="Törlés"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        fontSize:"0.74rem", color:"rgba(55,182,255,.6)",
                        display:"flex", alignItems:"center", gap:5,
                      }}>
                        <i className="bi bi-box-arrow-up-right"></i>
                        Hivatalos oldal
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
