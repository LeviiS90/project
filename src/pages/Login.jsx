import { useState } from "react";
import { login, register, logout } from "../api.js";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const isLoggedIn = !!localStorage.getItem("token");

  async function submit(e) {
    e.preventDefault();
    setOk(""); setErr("");

    if (!email.trim() || !password.trim()) {
      setErr("Hiba: üres mezők (email/jelszó)!");
      return;
    }

    try {
      if (mode === "register") {
        await register(email, password);
        setOk("✅ Regisztráció kész! Most jelentkezz be.");
        setMode("login");
      } else {
        await login(email, password);
        setOk("✅ Sikeres bejelentkezés (token mentve).");
      }
      setEmail(""); setPassword("");
    } catch (e2) {
      setErr(String(e2.message || e2));
    }
  }

  function doLogout() {
    logout();
    setOk("Kijelentkezve.");
    setErr("");
  }

  return (
    <div className="card hover p-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h3 className="m-0" style={{ fontWeight: 900 }}>
          🔐 {mode === "login" ? "Login" : "Register"}
        </h3>

        <div className="d-flex gap-2">
          <button className={`btn btn-sm ${mode === "login" ? "neon-btn" : "neon-btn-outline"}`} type="button"
            onClick={() => { setMode("login"); setOk(""); setErr(""); }}>
            Login
          </button>
          <button className={`btn btn-sm ${mode === "register" ? "neon-btn" : "neon-btn-outline"}`} type="button"
            onClick={() => { setMode("register"); setOk(""); setErr(""); }}>
            Register
          </button>
        </div>
      </div>

      <div className="mt-2" style={{ opacity: 0.85 }}>
        {isLoggedIn ? "✅ Be vagy jelentkezve." : "⚠️ Nem vagy bejelentkezve."}
      </div>

      {ok && <div className="alert alert-success mt-3">{ok}</div>}
      {err && <div className="alert alert-danger mt-3">{err}</div>}

      <form onSubmit={submit} className="mt-3">
        <label className="form-label">Email</label>
        <input className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} />

        <label className="form-label mt-3">Jelszó</label>
        <input className="form-control" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />

        <div className="d-flex gap-2 mt-3 flex-wrap">
          <button className="btn neon-btn" type="submit">
            {mode === "login" ? "Belépés" : "Regisztráció"}
          </button>
          <button className="btn neon-btn-outline" type="button" onClick={doLogout} disabled={!isLoggedIn}>
            Kijelentkezés
          </button>
        </div>
      </form>

      <div className="mt-3" style={{ opacity: 0.75, fontSize: 12 }}>
        Admin teszthez: db.json-ban állítsd a user role-ját „admin”-ra, majd új login.
      </div>
    </div>
  );
}
