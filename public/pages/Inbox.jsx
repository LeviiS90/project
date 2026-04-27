/**
 * pages/Inbox.jsx
 * – Személyes (privát) üzenetrendszer
 * – Beérkező / Elküldött / Új üzenet fülek
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

const { useEffect, useState } = React;

window.NGH.pages.Inbox = function Inbox({ auth }) {
  const api        = window.NGH.lib.api;
  const formatDate = window.NGH.lib.formatDate;
  const SectionTitle = window.NGH.components.SectionTitle;

  const [tab, setTab]       = useState("inbox");
  const [inbox, setInbox]   = useState([]);
  const [sent, setSent]     = useState([]);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const [newMsg, setNewMsg] = useState({ to: "", message: "" });

  if (!auth?.user) {
    return (
      <div className="neon-card p-5 text-center">
        <i className="bi bi-lock-fill fs-1 neon d-block mb-3"></i>
        <div className="fw-semibold neon mb-2" style={{fontFamily:"Orbitron,monospace"}}>Bejelentkezés szükséges</div>
        <div className="small-muted mb-3">A személyes üzenetek megtekintéséhez be kell jelentkezned.</div>
        <a href="#/login" className="btn btn-neon">Bejelentkezés</a>
      </div>
    );
  }

  async function load() {
    setLoading(true); setErr("");
    try {
      const data = await api("/api/pm", { token: auth.token });
      setInbox(data.inbox || []);
      setSent(data.sent || []);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  async function loadUsers() {
    try { setUsers(await api("/api/pm/users", { token: auth.token })); } catch {}
  }

  useEffect(() => { load(); loadUsers(); }, []);

  async function markRead(msg) {
    if (msg.read_at) return;
    try { await api(`/api/pm/${msg.id}/read`, { method: "PUT", token: auth.token }); } catch {}
    setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m));
  }

  async function deleteMsg(id) {
    if (!window.confirm("Biztosan törlöd ezt az üzenetet?")) return;
    try {
      await api(`/api/pm/${id}`, { method: "DELETE", token: auth.token });
      setInbox(prev => prev.filter(m => m.id !== id));
      setSent(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) { alert(e.message); }
  }

  async function sendMsg(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      await api("/api/pm", { method: "POST", token: auth.token, body: newMsg });
      setSuccess(`✅ Üzenet elküldve → ${newMsg.to}`);
      setNewMsg({ to: "", message: "" });
      await load();
      setTimeout(() => setTab("sent"), 800);
    } catch (e) { setErr(e.message); }
  }

  const unreadCount = inbox.filter(m => !m.read_at).length;

  const TabBtn = ({ name, icon, label, badge }) => (
    <button
      className={`btn btn-sm ${tab === name ? "btn-neon" : "btn-outline-light"}`}
      onClick={() => { setTab(name); setSelected(null); }}
    >
      <i className={`bi ${icon} me-1`}></i>{label}
      {badge > 0 && (
        <span className="ms-2 badge" style={{
          background:"rgba(255,61,113,.25)", border:"1px solid rgba(255,61,113,.4)",
          color:"#ff3d71", fontSize:"0.62rem", borderRadius:8, padding:"1px 6px"
        }}>{badge}</span>
      )}
    </button>
  );

  return (
    <div>
      <SectionTitle
        icon="bi-envelope-fill"
        title="Személyes üzenetek"
        subtitle={`Privát üzenetek${unreadCount > 0 ? ` · ${unreadCount} olvasatlan` : ""}`}
      />

      {/* Tab bar */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <TabBtn name="inbox" icon="bi-inbox"          label={`Beérkező (${inbox.length})`} badge={unreadCount} />
        <TabBtn name="sent"  icon="bi-send"           label={`Elküldött (${sent.length})`} />
        <button
          className={`btn btn-sm ms-auto ${tab === "new" ? "btn-neon" : "btn-outline-light"}`}
          style={{
            borderColor:"rgba(184,75,255,.4)", color: tab==="new" ? undefined : "var(--neon2)",
            background: tab==="new" ? undefined : "rgba(184,75,255,.08)"
          }}
          onClick={() => { setTab("new"); setSelected(null); }}
        >
          <i className="bi bi-pencil-square me-1"></i>Új üzenet
        </button>
      </div>

      {err     && <div className="alert alert-danger  py-2 mb-3">{err}</div>}
      {success && <div className="alert alert-success py-2 mb-3">{success}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-info" style={{width:30,height:30,borderWidth:2}}></div>
        </div>
      )}

      {/* ── Új üzenet ── */}
      {tab === "new" && !loading && (
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="neon-card p-4 glow">
              <div className="fw-semibold neon mb-4" style={{fontFamily:"Orbitron,monospace",fontSize:"0.88rem"}}>
                <i className="bi bi-pencil-square me-2"></i>Új privát üzenet írása
              </div>
              <form onSubmit={sendMsg}>
                <div className="mb-3">
                  <label className="form-label small-muted">Címzett felhasználóneve</label>
                  <input
                    className="form-control"
                    list="user-suggestions"
                    placeholder="Írj be egy felhasználónevet..."
                    value={newMsg.to}
                    onChange={e => setNewMsg({ ...newMsg, to: e.target.value })}
                    autoComplete="off"
                    required
                  />
                  <datalist id="user-suggestions">
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </datalist>
                  <div className="small-muted mt-1" style={{fontSize:"0.72rem"}}>
                    <i className="bi bi-lightbulb me-1"></i>Kezdj el gépelni — a rendszer javasol felhasználókat
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label small-muted">Üzenet szövege</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Írd ide az üzenetedet..."
                    value={newMsg.message}
                    onChange={e => setNewMsg({ ...newMsg, message: e.target.value })}
                    required
                  />
                </div>
                <button className="btn btn-neon w-100" type="submit">
                  <i className="bi bi-send me-2"></i>Üzenet küldése
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Beérkező ── */}
      {tab === "inbox" && !loading && (
        <div className="row g-3">
          {/* Üzenet lista */}
          <div className={`col-md-${selected ? 5 : 12}`}>
            {inbox.length === 0 ? (
              <div className="neon-card p-5 text-center">
                <i className="bi bi-inbox fs-1 d-block mb-3" style={{color:"rgba(55,182,255,.3)"}}></i>
                <div className="small-muted">Nincs beérkező üzeneted.</div>
                <button className="btn btn-neon btn-sm mt-3" onClick={() => setTab("new")}>
                  <i className="bi bi-pencil-square me-1"></i>Írj valakinek
                </button>
              </div>
            ) : (
              <div className="vstack gap-2">
                {inbox.map(m => (
                  <div
                    key={m.id}
                    className="neon-card p-3"
                    style={{
                      cursor:"pointer",
                      border: selected?.id === m.id
                        ? "1px solid rgba(55,182,255,.5)"
                        : m.read_at ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(55,182,255,.22)",
                      background: !m.read_at ? "rgba(55,182,255,.03)" : undefined,
                      transition:"border-color .15s, transform .1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform="translateX(2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform="translateX(0)"}
                    onClick={() => { setSelected(m); markRead(m); }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        {!m.read_at && (
                          <span style={{
                            width:7, height:7, borderRadius:"50%",
                            background:"#37b6ff", display:"inline-block", flexShrink:0
                          }}></span>
                        )}
                        <span className="fw-semibold neon" style={{fontSize:"0.88rem"}}>{m.from_name}</span>
                        {!m.read_at && (
                          <span className="pill" style={{fontSize:"0.55rem",padding:"1px 6px"}}>ÚJ</span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="small-muted" style={{fontSize:"0.7rem"}}>{formatDate(m.created_at)}</span>
                        <button
                          className="btn btn-sm p-0" title="Törlés"
                          style={{color:"rgba(255,61,113,.45)",background:"none",border:"none",lineHeight:1}}
                          onClick={e => { e.stopPropagation(); deleteMsg(m.id); }}
                        ><i className="bi bi-trash" style={{fontSize:"0.8rem"}}></i></button>
                      </div>
                    </div>
                    <div style={{
                      fontSize:"0.8rem", color:"var(--muted)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
                    }}>{m.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Megnyitott üzenet */}
          {selected && (
            <div className="col-md-7">
              <div className="neon-card p-4 glow" style={{position:"sticky", top:80}}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="fw-semibold neon mb-1" style={{fontFamily:"Orbitron,monospace",fontSize:"0.9rem"}}>
                      {selected.from_name}
                    </div>
                    <div className="small-muted" style={{fontSize:"0.72rem"}}>
                      <i className="bi bi-clock me-1"></i>{formatDate(selected.created_at)}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-neon btn-sm"
                      onClick={() => {
                        setNewMsg({ to: selected.from_name, message: "" });
                        setTab("new"); setSelected(null);
                      }}
                    ><i className="bi bi-reply me-1"></i>Válasz</button>
                    <button
                      className="btn btn-sm"
                      style={{background:"rgba(255,61,113,.12)",border:"1px solid rgba(255,61,113,.3)",color:"#ff3d71"}}
                      onClick={() => deleteMsg(selected.id)}
                    ><i className="bi bi-trash"></i></button>
                    <button
                      className="btn btn-outline-light btn-sm"
                      onClick={() => setSelected(null)}
                    >×</button>
                  </div>
                </div>
                <hr style={{borderColor:"rgba(55,182,255,.12)", margin:"0.75rem 0"}} />
                <div style={{
                  fontSize:"0.92rem", lineHeight:1.75, color:"var(--text)",
                  whiteSpace:"pre-wrap", wordBreak:"break-word"
                }}>
                  {selected.message}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Elküldött ── */}
      {tab === "sent" && !loading && (
        <div className="vstack gap-2">
          {sent.length === 0 ? (
            <div className="neon-card p-5 text-center">
              <i className="bi bi-send fs-1 d-block mb-3" style={{color:"rgba(55,182,255,.3)"}}></i>
              <div className="small-muted">Még nem küldtél privát üzenetet.</div>
              <button className="btn btn-neon btn-sm mt-3" onClick={() => setTab("new")}>
                <i className="bi bi-pencil-square me-1"></i>Első üzenet küldése
              </button>
            </div>
          ) : sent.map(m => (
            <div key={m.id} className="neon-card p-3" style={{border:"1px solid rgba(255,255,255,.07)"}}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="small-muted" style={{fontSize:"0.75rem"}}>→ Küldve:</span>
                  <span className="fw-semibold neon" style={{fontSize:"0.88rem"}}>{m.to_name}</span>
                  {m.read_at ? (
                    <span style={{fontSize:"0.65rem",color:"var(--neon3)",display:"flex",alignItems:"center",gap:3}}>
                      <i className="bi bi-check2-all"></i>Elolvasva
                    </span>
                  ) : (
                    <span style={{fontSize:"0.65rem",color:"var(--muted)"}}>
                      <i className="bi bi-clock me-1"></i>Olvasatlan
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="small-muted" style={{fontSize:"0.7rem"}}>{formatDate(m.created_at)}</span>
                  <button
                    className="btn btn-sm p-0" title="Törlés"
                    style={{color:"rgba(255,61,113,.45)",background:"none",border:"none"}}
                    onClick={() => deleteMsg(m.id)}
                  ><i className="bi bi-trash" style={{fontSize:"0.8rem"}}></i></button>
                </div>
              </div>
              <div style={{
                fontSize:"0.8rem", color:"var(--muted)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
              }}>{m.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
