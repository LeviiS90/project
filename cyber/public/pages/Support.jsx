/**
 * pages/Support.jsx
 * ----------------
 * Support / Contact (donate eltávolítva)
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

const { useState } = React;

window.NGH.pages.Support = function Support({ auth }){
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState("");

  // Ha nincs bejelentkezve, login üzenet mutatása
  if (!auth || !auth.token) {
    return (
      <div>
        <SectionTitle icon="bi-life-preserver" title="Contact" subtitle="Küldjél üzenetet — válaszolunk!"/>
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="neon-card p-4 glow border-neon text-center">
              <i className="bi bi-lock" style={{fontSize:"2.5rem", color:"var(--neon)"}}></i>
              <div className="fw-semibold neon mt-3 mb-2" style={{fontSize:"1.1rem"}}>
                Bejelentkezés szükséges
              </div>
              <div className="small-muted mb-4">
                Az üzenet küldéséhez be kell jelentkezned.
              </div>
              <a href="#/login" className="btn btn-neon">
                <i className="bi bi-box-arrow-in-right me-2"></i>Bejelentkezés
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function submitContact(e){
    e.preventDefault();
    setStatus("");
    try{
      await api("/api/support", { method:"POST", body:{ email, message } });
      const okMsg = "Köszönjük! Az üzenetet elküldtük.";
      setStatus(okMsg);
      window.alert(okMsg);
      setName(""); setEmail(""); setMessage("");
    }catch(e){ setStatus(e.message); }
  }

  return (
    <div>
      <SectionTitle icon="bi-life-preserver" title="Contact" subtitle="Küldjél üzenetet — válaszolunk!"/>
      {status && <div className="alert alert-info">{status}</div>}
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="neon-card p-4 glow border-neon">
            <div className="fw-semibold neon mb-3"><i className="bi bi-envelope me-2"></i>Kapcsolat</div>
            <form onSubmit={submitContact}>
              <div className="row g-2">
                <div className="col-md-6">
                  <input className="form-control" placeholder="Név" value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <textarea className="form-control" rows="5" placeholder="Üzenet..." value={message} onChange={e=>setMessage(e.target.value)} required></textarea>
                </div>
                <div className="col-12 d-flex justify-content-end">
                  <button className="btn btn-neon"><i className="bi bi-send me-2"></i>Küldés</button>
                </div>
              </div>
              <div className="small-muted mt-2">Visszaigazoló üzenetet kapsz (demo).</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
