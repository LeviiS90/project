/**
 * pages/GOTY.jsx
 * -------------
 * GOTY oldal:
 * - GET /api/goty → mindig pontosan 10 év (aktuális év → -9)
 * - Admin: POST /api/goty (szerkesztés / hozzáadás)
 * - Timeline + fancy kártyák, kattintás → hivatalos link
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

const { useEffect, useState } = React;

window.NGH.pages.GOTY = function GOTY({auth}){
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [adminForm, setAdminForm] = useState({ year: new Date().getFullYear(), title:"", description:"", url:"", cover:"" });
  const isAdmin = auth?.user?.role === "admin";

  async function load(){
    setErr("");
    try { setItems(await api("/api/goty")); }
    catch(e){ setErr(e.message || "Hiba"); }
  }

  useEffect(()=>{ load(); }, []);

  async function saveGOTY(e){
    e.preventDefault();
    try{
      await api("/api/goty", { method:"POST", token: auth.token, body: adminForm });
      await load();
      window.NGH.toast("Létrehozva / frissítve!", { position: "br" });
      // kényelmi: következő év előtöltése
      setAdminForm(f => ({ ...f, title: "", description: "", url: "", cover: "" }));
    }catch(err){ alert(err.message); }
  }

  async function deleteGOTY(year){
    if(!confirm(`${year} GOTY törlése?`)) return;
    try{
      await api(`/api/goty/${year}`, { method:"DELETE", token: auth.token });
      window.NGH.toast("GOTY törölve!", { position: "br" });
      await load();
    }catch(e){
      window.NGH.toast(e.message || "Hiba törlésnél", { position: "br" });
    }
  }

  function quickFill(g){
    // kattintás a kártyán: admin form kitöltése (nem navigál)
    if(!isAdmin) return;
    setAdminForm({
      year: g.year,
      title: g.title || "",
      description: g.description || "",
      url: g.url || "",
      cover: g.cover || ""
    });
    window.NGH.toast("Kitöltve a szerkesztőbe", { position: "br" });
  }

  return (
    <div>
      <SectionTitle icon="bi-trophy" title="Az év játéka — elmúlt 10 év" subtitle="Pontosan 10 év • timeline • fancy kártyák • kattintás = hivatalos link"/>
      {err && <div className="alert alert-danger">{err}</div>}

      {isAdmin && (
        <div className="neon-card p-3 glow mb-3">
          <div className="fw-semibold neon mb-2"><i className="bi bi-pencil-square me-2"></i>Admin: GOTY szerkesztés</div>
          <form className="row g-2" onSubmit={saveGOTY}>
            <div className="col-md-2">
              <input className="form-control" type="number" value={adminForm.year}
                onChange={e=>setAdminForm({...adminForm, year:Number(e.target.value)})} />
            </div>
            <div className="col-md-4">
              <input className="form-control" placeholder="Játék címe" value={adminForm.title}
                onChange={e=>setAdminForm({...adminForm, title:e.target.value})} />
            </div>
            <div className="col-md-6">
              <input className="form-control" placeholder="Hivatalos link (url)" value={adminForm.url}
                onChange={e=>setAdminForm({...adminForm, url:e.target.value})} />
            </div>
            <div className="col-md-12">
              <input className="form-control" placeholder="Kép URL (cover, opcionális)" value={adminForm.cover}
                onChange={e=>setAdminForm({...adminForm, cover:e.target.value})} />
            </div>
            <div className="col-md-12">
              <textarea className="form-control" rows="2" placeholder="Leírás" value={adminForm.description}
                onChange={e=>setAdminForm({...adminForm, description:e.target.value})}></textarea>
            </div>
            <div className="col-md-12 d-flex justify-content-end">
              <button className="btn btn-neon"><i className="bi bi-save me-2"></i>Mentés</button>
            </div>
          </form>
          <div className="small-muted mt-2">A GET /api/goty mindig 10 évet ad vissza (aktuális év → -9).</div>
        </div>
      )}

      <div className="timeline">
        {items.map(g => (
          <div key={g.year} className="titem">
            <div className="tdot"></div>
            <a className="tcard d-block text-decoration-none" href={g.url || "#"}
               target={g.url ? "_blank" : "_self"} rel="noreferrer"
               onClick={(e)=>{ if(isAdmin){ e.preventDefault(); quickFill(g);} }}>
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div className="pill mb-2 d-inline-block"><i className="bi bi-calendar2-week me-1"></i>{g.year}</div>
                  <div className="h5 mb-1 neon">{g.title}</div>
                  <div className="small-muted">{g.description}</div>
                  {isAdmin && (
                    <div className="mt-2 d-flex gap-2 flex-wrap">
                      <button className="btn btn-outline-light btn-sm" type="button"
                              onClick={(e)=>{ e.preventDefault(); quickFill(g); }}>
                        <i className="bi bi-pencil me-1"></i>Szerkesztés
                      </button>
                      <button className="btn btn-outline-danger btn-sm" type="button"
                              onClick={(e)=>{ e.preventDefault(); deleteGOTY(g.year); }}>
                        <i className="bi bi-trash3 me-1"></i>Törlés
                      </button>
                    </div>
                  )}
                </div>
                <div style={{minWidth:110}}>
                  {g.cover ? (
                    <img src={g.cover} className="rounded-4 glow2 w-100"
                         style={{aspectRatio:"1/1", objectFit:"cover"}}
                         onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                  ) : (
                    <div className="neon-card p-3 text-center glow2">
                      <i className="bi bi-stars fs-2 text-info"></i>
                      <div className="small-muted mt-2">cover opcionális</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="small-muted mt-2">
                {isAdmin
                  ? <span><i className="bi bi-magic me-1"></i>Admin: kattintás = gyors szerkesztés</span>
                  : <span><i className="bi bi-box-arrow-up-right me-1"></i>Kattints a hivatalos oldalhoz</span>
                }
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
