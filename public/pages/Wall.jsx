/**
 * pages/Wall.jsx
 * --------------
 * Üzenőfal:
 * - GET /api/weekly-topics/current → aktuális heti téma
 * - GET /api/messages → publikus üzenetek
 * - POST /api/messages → új üzenet (JWT kell, különben 401)
 * - Admin: DELETE /api/messages/:id és POST /api/weekly-topics/current
 *
 * FONTOS: nincs bundler/import → minden fájl ugyanabban a globális scope-ban fut.
 * Ezért NEM deklarálunk globálisan pl. `const {useEffect} = React;`-et,
 * mert több fájlban ütközne ("already been declared").
 * Ehelyett React.useEffect / React.useState használat.
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

window.NGH.pages.Wall = function Wall({ auth }) {
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;
  const formatDate = window.NGH.lib.formatDate;

  const [topic, setTopic] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");
  const [adminTopic, setAdminTopic] = React.useState("");

  const isAdmin = auth?.user?.role === "admin";

  async function load() {
    setErr("");
    try {
      const t = await api("/api/weekly-topics/current");
      const msgs = await api("/api/messages");
      setTopic(t);
      setMessages(msgs);
    } catch (e) {
      setErr(e.message || "Hiba");
    }
  }

  React.useEffect(() => { load(); }, []);

  async function sendMessage(e) {
    e.preventDefault();
    setErr("");
    try {
      await api("/api/messages", { method: "POST", token: auth.token, body: { text } });
      setText("");
      await load();
      window.NGH.toast?.("Üzenet elküldve!");
    } catch (e) {
      if (e.status === 401) setErr("401 Unauthorized: Üzenet küldéséhez be kell jelentkezni.");
      else setErr(e.message || "Hiba");
    }
  }

  async function deleteMessage(id) {
    // NINCS felugró alert/confirm: csak toast (kérés)
    try {
      await api(`/api/messages/${id}`, { method: "DELETE", token: auth.token });
      window.NGH.toast?.("Üzenet törölve!");
      await load();
    } catch (e) {
      window.NGH.toast?.(e.message || "Hiba törlésnél");
    }
  }

  async function updateTopic(e) {
    e.preventDefault();
    try {
      await api("/api/weekly-topics/current", { method: "POST", token: auth.token, body: { title: adminTopic } });
      setAdminTopic("");
      await load();
      window.NGH.toast?.("Heti téma frissítve!");
    } catch (e) {
      window.NGH.toast?.(e.message || "Hiba");
    }
  }

  return (
    <div>
      <SectionTitle icon="bi-chat-dots" title="Üzenőfal" subtitle="Hetente frissülő téma • üzenetlista • új üzenet űrlap" />
      {err && <div className="alert alert-warning">{err}</div>}

      <div className="neon-card p-3 glow mb-3">
        <div className="d-flex justify-content-between flex-wrap gap-2">
          <div>
            <div className="small-muted">Aktuális heti téma</div>
            <div className="h5 neon mb-0">{topic?.title || "..."}</div>
            <div className="small-muted">Hét kezdete (UTC hétfő): {topic?.weekStartISO}</div>
          </div>

          {isAdmin && (
            <form className="d-flex gap-2 align-items-start" onSubmit={updateTopic}>
              <input
                className="form-control"
                style={{ minWidth: 280 }}
                placeholder="Új heti téma..."
                value={adminTopic}
                onChange={e => setAdminTopic(e.target.value)}
              />
              <button className="btn btn-neon btn-sm">
                <i className="bi bi-check2-circle me-1"></i>Beállít
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="neon-card p-3 glow2">
            <div className="fw-semibold neon mb-2"><i className="bi bi-send me-2"></i>Új üzenet</div>
            <form onSubmit={sendMessage}>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Írd ide az üzenetedet..."
                value={text}
                onChange={e => setText(e.target.value)}
              ></textarea>

              <button className="btn btn-neon mt-2 w-100">
                <i className="bi bi-lightning-charge me-2"></i>Küldés
              </button>

              {!auth?.user && (
                <div className="small-muted mt-2">
                  Nem vagy bejelentkezve → küldésnél 401 hibát kapsz (követelmény).
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="neon-card p-3 glow">
            <div className="fw-semibold neon mb-2"><i className="bi bi-list-ul me-2"></i>Üzenetek</div>

            {/* Görgethető lista: ugyanaz az elv, mint a Hírek oldalon */}
            <div className="message-list">
              <div className="vstack gap-2">
                {messages.map(m => (
                  <div key={m.id} className="neon-card message-card">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div style={{ minWidth: 0 }}>
                        <div className="small-muted">
                          <span className="pill me-2">{m.topicTitle}</span>
                          <b className="neon">{m.username}</b> • {formatDate(m.createdAt)}
                        </div>
                        <div className="mt-2 message-text">{m.text}</div>
                      </div>

                      {isAdmin && (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => deleteMessage(m.id)} title="Admin törlés">
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <div className="small-muted">Még nincs üzenet.</div>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
