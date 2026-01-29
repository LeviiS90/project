import { useEffect, useState } from "react";
import { getWeeklyTopicCurrent, getMessages, postMessage } from "../api.js";

export default function Wall() {
  const [weekly, setWeekly] = useState(null);
  const [messages, setMessages] = useState([]);
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setErr(""); setOk("");
    try {
      const w = await getWeeklyTopicCurrent();
      setWeekly(w);
      setTopic(w.activeTopic || (w.topics?.[0] ?? ""));
    } catch {}
    try {
      setMessages(await getMessages());
    } catch {}
  }

  useEffect(() => { load(); }, []);

  async function send(e) {
    e.preventDefault();
    setErr(""); setOk("");

    if (!text.trim()) {
      setErr("Írj be üzenetet!");
      return;
    }

    try {
      await postMessage(text, topic);
      setOk("✅ Üzenet elküldve!");
      setText("");
      await load();
    } catch (e2) {
      const msg = String(e2.message || e2);
      if (msg.includes("401")) setErr("401 Unauthorized — be kell jelentkezned üzenetküldéshez!");
      else setErr(msg);
    }
  }

  return (
    <div>
      <h2 className="section-title">💬 Üzenőfal</h2>
      <p className="section-sub">Heti témához posztolás • mindenki látja</p>

      <div className="card soft p-3">
        <div className="fw-bold mb-2">📣 Heti téma</div>
        <div style={{ opacity: 0.85 }}>
          Aktív téma: <span style={{ color: "var(--cyan)", fontWeight: 800 }}>{weekly?.activeTopic || "—"}</span>
        </div>

        <div className="mt-3">
          <label className="form-label">Téma választása</label>
          <select className="form-select" value={topic} onChange={(e)=>setTopic(e.target.value)}>
            {(weekly?.topics || ["Nincs téma"]).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <form onSubmit={send} className="mt-3">
          <label className="form-label">Új üzenet</label>
          <textarea className="form-control" rows={3} value={text} onChange={(e)=>setText(e.target.value)} />

          <button className="btn neon-btn mt-3" type="submit">Küldés</button>
        </form>

        {err && <div className="alert alert-danger mt-3">{err}</div>}
        {ok && <div className="alert alert-success mt-3">{ok}</div>}
      </div>

      <div className="mt-4">
        <div className="section-title">🧾 Üzenetek</div>
        {messages.length === 0 ? (
          <div style={{ opacity: 0.8 }}>Nincsenek üzenetek.</div>
        ) : (
          <div className="row g-3">
            {messages.slice().reverse().slice(0, 12).map((m, i) => (
              <div key={i} className="col-12 col-md-6">
                <div className="card hover p-3 h-100">
                  <div className="fw-bold" style={{ color: "var(--cyan)" }}>{m.user}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>{m.topic || "—"} • {m.createdAt?.slice(0, 19)}</div>
                  <div className="mt-2" style={{ opacity: 0.95 }}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
