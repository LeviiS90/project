/**
 * App.jsx
 * -------
 * Mini router + auth state (localStorage) + oldalválasztás.
 * Login/Register itt van egyben, hogy file limiten belül maradjunk.
 */
window.NGH = window.NGH || {};

const { useEffect, useState } = React;

window.NGH.useHashRoute = function useHashRoute() {
  const [route, setRoute] = useState(() => (location.hash || "#/home"));
  useEffect(() => {
    const onHash = () => setRoute(location.hash || "#/home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route.replace("#", "");
};

window.NGH.App = function App(){
  const route = window.NGH.useHashRoute();

  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return { token, user };
  });

  function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token:null, user:null });
    location.hash = "#/home";
  }

  const page = route.split("?")[0];

  const Navbar = window.NGH.components.Navbar;
  const Footer = window.NGH.components.Footer;

  const Home = window.NGH.pages.Home;
  const Games = window.NGH.pages.Games;
  const GOTY = window.NGH.pages.GOTY;
  const Wall = window.NGH.pages.Wall;
  const Support = window.NGH.pages.Support;

  return (
    <div>
      <Navbar auth={auth} onLogout={logout} />
      <main className="container py-4">
        {page === "/home" && <Home auth={auth} />}
        {page === "/games" && <Games auth={auth} />}
        {page === "/goty" && <GOTY auth={auth} />}
        {page === "/wall" && <Wall auth={auth} />}
        {page === "/support" && <Support auth={auth} />}
        {page === "/news" && <window.NGH.pages.News auth={auth} />}
        {page === "/login" && <Login onAuth={setAuth} />}
        {page === "/register" && <Register />}
        {page === "/register-success" && <RegisterSuccess />}
        {page === "/register-cancel" && <RegisterCancel />}
        {page !== "/home" && page !== "/games" && page !== "/goty" && page !== "/wall" &&
         page !== "/support" && page !== "/news" && page !== "/login" && page !== "/register" && page !== "/register-success" && page !== "/register-cancel" && <NotFound />}
      </main>
      <Footer />
    </div>
  );

  function NotFound(){
    return (
      <div className="neon-card p-4 glow text-center">
        <h2 className="h4 neon">404</h2>
        <div className="small-muted">Nincs ilyen oldal. Menj vissza a <a href="#/home">Főoldalra</a>.</div>
      </div>
    );
  }

  function Login({onAuth}){
    const api = window.NGH.lib.api;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    async function submit(e){
      e.preventDefault();
      setErr("");
      try{
        const r = await api("/api/auth/login", { method:"POST", body:{ email, password } });
        localStorage.setItem("token", r.token);
        localStorage.setItem("user", JSON.stringify(r.user));
        onAuth({ token: r.token, user: r.user });
        location.hash = "#/home";
      }catch(e){ setErr(e.message || "Hiba"); }
    }

    return (
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="neon-card p-4 glow border-neon">
            <h2 className="h4 neon mb-1"><i className="bi bi-person-check me-2"></i>Bejelentkezés</h2>
            <div className="small-muted mb-3">Email + jelszó. Admin: <b>admin</b> / <b>admin123</b> (az Email mezőbe írd: admin)</div>
            {err && <div className="alert alert-danger">{err}</div>}
            <form onSubmit={submit}>
              <label className="small-muted mb-1">Email (vagy admin felhasználónév)</label>
              <input className="form-control mb-3" value={email} onChange={e=>setEmail(e.target.value)} placeholder="pl. te@pelda.hu" />

              <label className="small-muted mb-1">Jelszó</label>
              <input type="password" className="form-control mb-3" value={password} onChange={e=>setPassword(e.target.value)} />

              <button className="btn btn-neon w-100"><i className="bi bi-lightning me-2"></i>Belépés</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  function Register(){
    const api = window.NGH.lib.api;
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [info, setInfo] = useState("");

    async function submit(e){
      e.preventDefault();
      setErr(""); setInfo("");
      try{
        setInfo("Átirányítás a biztonságos fizetéshez…");
        const r = await api("/api/auth/register", { method:"POST", body:{ name, email, password } });
        if (r.checkoutUrl) {
          window.location.href = r.checkoutUrl; // Stripe Checkout
        } else {
          setErr("Nem kaptam checkout URL-t a szervertől.");
          setInfo("");
        }
      }catch(e){
        setErr(e.message || "Hiba");
        setInfo("");
      }
    }

    return (
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="neon-card p-4 glow2 border-neon">
            <h2 className="h4 neon mb-1"><i className="bi bi-person-plus me-2"></i>Regisztráció</h2>
            <div className="small-muted mb-3">Név + email + jelszó → fizetés (Stripe Checkout) → aktiválás</div>
            {err && <div className="alert alert-danger">{err}</div>}
            {info && <div className="alert alert-info">{info}</div>}
            <form onSubmit={submit}>
              <label className="small-muted mb-1">Név</label>
              <input className="form-control mb-3" value={name} onChange={e=>setName(e.target.value)} placeholder="pl. Levente" />

              <label className="small-muted mb-1">Email</label>
              <input type="email" className="form-control mb-3" value={email} onChange={e=>setEmail(e.target.value)} placeholder="pl. te@pelda.hu" />

              <label className="small-muted mb-1">Jelszó</label>
              <input type="password" className="form-control mb-3" value={password} onChange={e=>setPassword(e.target.value)} placeholder="min. 6 karakter" />

              <button className="btn btn-neon w-100"><i className="bi bi-credit-card-2-front me-2"></i>Fizetés és regisztráció</button>
            </form>
            <div className="small-muted mt-3">
              A fiók csak <b>sikeres fizetés</b> után aktiválódik.
            </div>
          </div>
        </div>
      </div>
    );
  }

  function RegisterSuccess(){
    const api = window.NGH.lib.api;
    const [state, setState] = useState({ loading: true, ok: false, err: "", user: null });

    useEffect(() => {
      (async () => {
        try{
          const q = new URLSearchParams(location.hash.split("?")[1] || "");
          const session_id = q.get("session_id");
          if(!session_id) throw new Error("Hiányzó session_id.");
          const r = await api(`/api/auth/confirm?session_id=${encodeURIComponent(session_id)}`);
          setState({ loading:false, ok:true, err:"", user: r.user || null });
        }catch(e){
          setState({ loading:false, ok:false, err: e.message || "Hiba", user:null });
        }
      })();
    }, []);

    return (
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="neon-card p-4 glow border-neon">
            <h2 className="h4 neon mb-2"><i className="bi bi-check2-circle me-2"></i>Fizetés sikeres</h2>

            {state.loading && <div className="alert alert-info">Fiók aktiválása…</div>}

            {!state.loading && state.ok && (
              <div className="alert alert-success">
                Kész! A fiók aktiválva{state.user?.email ? `: ${state.user.email}` : ""}. Most már be tudsz jelentkezni.
              </div>
            )}

            {!state.loading && !state.ok && (
              <div className="alert alert-danger">
                Nem sikerült az aktiválás: {state.err}
              </div>
            )}

            <a className="btn btn-neon" href="#/login"><i className="bi bi-box-arrow-in-right me-2"></i>Ugrás a Loginra</a>
          </div>
        </div>
      </div>
    );
  }

  function RegisterCancel(){
    return (
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="neon-card p-4 glow2 border-neon">
            <h2 className="h4 neon mb-2"><i className="bi bi-x-circle me-2"></i>Fizetés megszakítva</h2>
            <div className="small-muted mb-3">Nem történt terhelés. Ha szeretnéd, indítsd újra a regisztrációt.</div>
            <a className="btn btn-neon me-2" href="#/register"><i className="bi bi-arrow-repeat me-2"></i>Újra regisztrálok</a>
            <a className="btn btn-outline-light" href="#/home">Vissza a főoldalra</a>
          </div>
        </div>
      </div>
    );
  }
};
