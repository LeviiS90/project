import { useState } from "react";
import { sendSupport, donate } from "../api.js";

export default function Support() {
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [donName, setDonName] = useState("");
  const [amount, setAmount] = useState("");

  async function submitSupport(e) {
    e.preventDefault();
    setOk(""); setErr("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErr("Hiba: minden mezőt ki kell tölteni!");
      return;
    }

    try {
      const r = await sendSupport({ name, email, message });
      setOk(r.reply || "Köszi! Megkaptuk az üzeneted.");
      setName(""); setEmail(""); setMessage("");
    } catch (e2) {
      setErr(String(e2.message || e2));
    }
  }

  async function submitDonate(e) {
    e.preventDefault();
    setOk(""); setErr("");

    if (!donName.trim() || !amount || Number(amount) <= 0) {
      setErr("Hiba: név + pozitív összeg kell!");
      return;
    }

    try {
      const r = await donate({ name: donName, amount: Number(amount) });
      setOk(r.reply || "Köszi a támogatást!");
      setDonName(""); setAmount("");
    } catch (e2) {
      setErr(String(e2.message || e2));
    }
  }

  return (
    <div>
      <h2 className="section-title">🛟 Support / Contact</h2>
      <p className="section-sub">Kapcsolat + opcionális támogatás</p>

      {ok && <div className="alert alert-success">{ok}</div>}
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <form onSubmit={submitSupport} className="card hover p-3 h-100">
            <div className="fw-bold">📩 Üzenet küldése</div>

            <label className="form-label mt-2">Név</label>
            <input className="form-control" value={name} onChange={(e)=>setName(e.target.value)} />

            <label className="form-label mt-2">Email</label>
            <input className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} />

            <label className="form-label mt-2">Üzenet</label>
            <textarea className="form-control" rows={4} value={message} onChange={(e)=>setMessage(e.target.value)} />

            <button className="btn neon-btn mt-3" type="submit">Küldés</button>
          </form>
        </div>

        <div className="col-12 col-lg-6">
          <form onSubmit={submitDonate} className="card hover p-3 h-100">
            <div className="fw-bold">💜 Donate (opcionális)</div>

            <label className="form-label mt-2">Név</label>
            <input className="form-control" value={donName} onChange={(e)=>setDonName(e.target.value)} />

            <label className="form-label mt-2">Összeg (Ft)</label>
            <input className="form-control" type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} />

            <button className="btn neon-btn mt-3" type="submit">Támogatás</button>
          </form>
        </div>
      </div>
    </div>
  );
}
