/**
 * App.jsx
 * -------
 * Mini router + auth state (localStorage) + oldalválasztás.
 * Login/Register formák szebb designnal + bugfixek.
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
  if (!location.hash) location.hash = "#/home";
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
  const Home    = window.NGH.pages.Home;
  const Games   = window.NGH.pages.Games;
  const GOTY    = window.NGH.pages.GOTY;
  const Wall    = window.NGH.pages.Wall;
  const Support = window.NGH.pages.Support;

  const pages = ["/home","/games","/goty","/wall","/support","/news","/login","/register","/register-success","/register-cancel"];

  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column"}}>
      <Navbar auth={auth} onLogout={logout} />
      <main className="container py-4 flex-grow-1">
        {page === "/home"             && <Home    auth={auth} />}
        {page === "/games"            && <Games   auth={auth} />}
        {page === "/goty"             && <GOTY    auth={auth} />}
        {page === "/wall"             && <Wall    auth={auth} />}
        {page === "/support"          && <Support auth={auth} />}
        {page === "/news"             && <window.NGH.pages.News auth={auth} />}
        {page === "/login"            && <Login   onAuth={setAuth} />}
        {page === "/register"         && <Register />}
        {page === "/register-success" && <RegisterSuccess />}
        {page === "/register-cancel"  && <RegisterCancel />}
        {!pages.includes(page)        && <NotFound />}
      </main>
      <Footer />
    </div>
  );

  /* ─── RegisterSuccess ─── */
  function RegisterSuccess(){
    const api = window.NGH.lib.api;
    const [state, setState] = useState({ loading:true, ok:false, msg:"" });

    useEffect(() => {
      (async () => {
        try{
          const q = new URLSearchParams(location.hash.split("?")[1] || "");
          const pid = q.get("pid");
          if(!pid){
            setState({ loading:false, ok:true, msg:"Sikeres regisztráció! Most már be tudsz jelentkezni." });
            return;
          }
          await api("/api/auth/activate", { method:"POST", body:{ pid } });
          setState({ loading:false, ok:true, msg:"Fiók aktiválva! Most már be tudsz jelentkezni." });
        }catch(e){
          setState({ loading:false, ok:false, msg:(e.message||"Hiba aktiválásnál") });
        }
      })();
    }, []);

    return (
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="neon-card p-4 glow border-neon text-center">
            <div style={{fontSize:"3rem", marginBottom:"1rem"}}>
              {state.loading ? "⏳" : state.ok ? "✅" : "❌"}
            </div>
            <h2 className="h4 neon mb-2">Regisztráció</h2>
            {state.loading ? (
              <div className="small-muted">Aktiválás folyamatban…</div>
            ) : state.ok ? (
              <>
                <div className="alert alert-success">{state.msg}</div>
                <a className="btn btn-neon" href="#/login">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Bejelentkezés
                </a>
              </>
            ) : (
              <>
                <div className="alert alert-danger">{state.msg}</div>
                <a className="btn btn-outline-light" href="#/register">Vissza</a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── NotFound ─── */
  function NotFound(){
    return (
      <div className="row justify-content-center py-5">
        <div className="col-lg-5 text-center">
          <div className="neon-card p-5 glow">
            <div style={{
              fontFamily:"Orbitron, monospace",
              fontSize:"5rem", fontWeight:900,
              color:"rgba(55,182,255,.2)",
              lineHeight:1, marginBottom:"1rem"
            }}>404</div>
            <h2 className="neon mb-2" style={{fontFamily:"Orbitron, monospace", fontSize:"1rem"}}>
              OLDAL NEM TALÁLHATÓ
            </h2>
            <div className="small-muted mb-4">Nincs ilyen útvonal a Cyber Hubon.</div>
            <a href="#/home" className="btn btn-neon">
              <i className="bi bi-house me-2"></i>Főoldalra
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Login ─── */
  function Login({onAuth}){
    const api = window.NGH.lib.api;
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(e){
      e.preventDefault();
      setErr(""); setLoading(true);
      try{
        const r = await api("/api/auth/login", { method:"POST", body:{ identifier, password } });
        localStorage.setItem("token", r.token);
        localStorage.setItem("user", JSON.stringify(r.user));
        onAuth({ token: r.token, user: r.user });
        window.NGH.toast("Sikeres belépés!", { type:"success" });
        setTimeout(()=>{ location.hash = "#/home"; }, 300);
      }catch(e){
        setErr(e.message || "Hibás azonosító vagy jelszó");
      } finally { setLoading(false); }
    }

    return (
      <div className="row justify-content-center py-3">
        <div className="col-lg-5 col-md-7">
          <div className="neon-card p-4 p-lg-5 glow border-neon slide-in">
            {/* Header */}
            <div className="text-center mb-4">
              <div style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                width:56, height:56, borderRadius:16,
                background:"rgba(55,182,255,.12)",
                border:"1px solid rgba(55,182,255,.25)",
                marginBottom:"1rem", fontSize:"1.5rem", color:"var(--neon)"
              }}>
                <i className="bi bi-person-check-fill"></i>
              </div>
              <h2 className="neon mb-1" style={{fontFamily:"Orbitron, monospace", fontSize:"1.1rem", letterSpacing:"0.08em"}}>
                BEJELENTKEZÉS
              </h2>
              <div className="small-muted" style={{fontSize:"0.82rem"}}>
                Admin: <b style={{color:"var(--text)"}}>admin@local</b> / <b style={{color:"var(--text)"}}>admin123</b>
              </div>
            </div>

            {err && <div className="alert alert-danger py-2">{err}</div>}

            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Név vagy email</label>
                <div style={{position:"relative"}}>
                  <i className="bi bi-person" style={{
                    position:"absolute", left:"0.9rem", top:"50%", transform:"translateY(-50%)",
                    color:"var(--muted)", fontSize:"0.9rem"
                  }}></i>
                  <input
                    className="form-control"
                    style={{paddingLeft:"2.3rem"}}
                    value={identifier}
                    onChange={e=>setIdentifier(e.target.value)}
                    placeholder="admin@local"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Jelszó</label>
                <div style={{position:"relative"}}>
                  <i className="bi bi-key-fill" style={{
                    position:"absolute", left:"0.9rem", top:"50%", transform:"translateY(-50%)",
                    color:"var(--muted)", fontSize:"0.9rem"
                  }}></i>
                  <input
                    type="password"
                    className="form-control"
                    style={{paddingLeft:"2.3rem"}}
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button className="btn btn-neon w-100" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Belépés…</>
                  : <><i className="bi bi-lightning-fill me-2"></i>Belépés</>
                }
              </button>
            </form>

            <div className="text-center mt-4 small-muted">
              Még nincs fiókod?{" "}
              <a href="#/register" style={{color:"var(--neon2)"}}>Regisztrálj</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Register ─── */
  function Register(){
    const api = window.NGH.lib.api;
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(e){
      e.preventDefault();
      setErr(""); setInfo(""); setLoading(true);
      try{
        const r = await api("/api/auth/register", { method:"POST", body:{ name, email, password } });
        if (r.checkoutUrl) {
          window.location.href = r.checkoutUrl;
          return;
        }
        setInfo("Sikeres regisztráció! Most már be tudsz jelentkezni.");
        window.NGH.toast("Sikeres regisztráció!", { type:"success" });
        setTimeout(() => { location.hash = "#/login"; }, 900);
      }catch(e){
        setErr(e.message || "Hiba történt");
      } finally { setLoading(false); }
    }

    return (
      <div className="row justify-content-center py-3">
        <div className="col-lg-5 col-md-7">
          <div className="neon-card p-4 p-lg-5 glow2 border-neon slide-in">
            {/* Header */}
            <div className="text-center mb-4">
              <div style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                width:56, height:56, borderRadius:16,
                background:"rgba(184,75,255,.12)",
                border:"1px solid rgba(184,75,255,.25)",
                marginBottom:"1rem", fontSize:"1.5rem", color:"var(--neon2)"
              }}>
                <i className="bi bi-person-plus-fill"></i>
              </div>
              <h2 className="mb-1" style={{
                fontFamily:"Orbitron, monospace", fontSize:"1.1rem", letterSpacing:"0.08em",
                color:"var(--neon2)", textShadow:"0 0 20px rgba(184,75,255,.4)"
              }}>
                REGISZTRÁCIÓ
              </h2>
              <div className="small-muted" style={{fontSize:"0.82rem"}}>
                Hozz létre fiókot és csatlakozz a közösséghez
              </div>
            </div>

            {err  && <div className="alert alert-danger py-2">{err}</div>}
            {info && <div className="alert alert-success py-2">{info}</div>}

            <form onSubmit={submit}>
              {[
                { label:"Felhasználónév", icon:"bi-person", type:"text",     val:name,     set:setName,     ph:"pl. Gamer123" },
                { label:"Email cím",      icon:"bi-envelope", type:"email",  val:email,    set:setEmail,    ph:"pl. te@pelda.hu" },
                { label:"Jelszó",         icon:"bi-key-fill", type:"password", val:password, set:setPassword, ph:"min. 6 karakter" },
              ].map(f => (
                <div className="mb-3" key={f.label}>
                  <label className="form-label">{f.label}</label>
                  <div style={{position:"relative"}}>
                    <i className={`bi ${f.icon}`} style={{
                      position:"absolute", left:"0.9rem", top:"50%", transform:"translateY(-50%)",
                      color:"var(--muted)", fontSize:"0.9rem"
                    }}></i>
                    <input
                      type={f.type}
                      className="form-control"
                      style={{paddingLeft:"2.3rem"}}
                      value={f.val}
                      onChange={e=>f.set(e.target.value)}
                      placeholder={f.ph}
                      required
                    />
                  </div>
                </div>
              ))}

              <button
                className="btn btn-neon w-100 mt-2"
                disabled={loading}
                style={{background:"rgba(184,75,255,.12)", borderColor:"rgba(184,75,255,.35)"}}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Regisztráció…</>
                  : <><i className="bi bi-person-plus me-2"></i>Regisztráció</>
                }
              </button>
            </form>

            <div className="text-center mt-4 small-muted">
              Van már fiókod?{" "}
              <a href="#/login" style={{color:"var(--neon)"}}>Bejelentkezés</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── RegisterCancel ─── */
  function RegisterCancel(){
    return (
      <div className="row justify-content-center py-3">
        <div className="col-lg-6">
          <div className="neon-card p-4 p-lg-5 glow2 border-neon text-center">
            <div style={{fontSize:"3rem", marginBottom:"1rem"}}>⚡</div>
            <h2 className="mb-2" style={{
              fontFamily:"Orbitron, monospace", fontSize:"1rem", letterSpacing:"0.08em",
              color:"var(--neon2)"
            }}>
              FIZETÉS MEGSZAKÍTVA
            </h2>
            <div className="small-muted mb-4">
              Nem történt terhelés. Ha szeretnéd, indítsd újra a regisztrációt.
            </div>
            <div className="d-flex gap-2 justify-content-center">
              <a className="btn btn-neon" href="#/register">
                <i className="bi bi-arrow-repeat me-2"></i>Újra regisztrálok
              </a>
              <a className="btn btn-outline-light" href="#/home">
                <i className="bi bi-house me-2"></i>Főoldalra
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
};