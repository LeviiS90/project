/**
 * components/Layout.jsx
 * ---------------------
 * Layout elemek:
 * - Navbar (active link highlight, jobb design)
 * - Footer
 */
window.NGH = window.NGH || {};
window.NGH.components = window.NGH.components || {};

window.NGH.components.Navbar = function Navbar({auth, onLogout}){
  const isAdmin = auth?.user?.role === "admin";
  const { useState, useEffect } = React;

  const [route, setRoute] = useState(location.hash || "#/home");
  useEffect(() => {
    const onHash = () => setRoute(location.hash || "#/home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const isActive = (path) => route.startsWith(path);

  const navLinks = [
    { href: "#/home",    label: "Főoldal",   icon: "bi-house-fill" },
    { href: "#/games",   label: "Játékok",   icon: "bi-joystick" },
    { href: "#/news",    label: "Hírek",     icon: "bi-newspaper" },
    { href: "#/goty",    label: "GOTY",      icon: "bi-trophy-fill" },
    { href: "#/wall",    label: "Üzenőfal",  icon: "bi-chat-dots-fill" },
    { href: "#/support", label: "Contact",   icon: "bi-life-preserver" },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
      <div className="container">
        {/* Brand */}
        <a className="navbar-brand d-flex align-items-center gap-2" href="#/home">
          <span style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:32, height:32, borderRadius:8,
            background:"rgba(55,182,255,.12)",
            border:"1px solid rgba(55,182,255,.3)",
            fontSize:"1rem", color:"var(--neon)"
          }}>
            <i className="bi bi-controller"></i>
          </span>
          <span style={{letterSpacing:"0.1em"}}>
            CYBER <span className="neon">HUB</span>
          </span>
        </a>

        {/* Toggler */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Menü"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Nav links */}
          <ul className="navbar-nav mx-auto gap-lg-1">
            {navLinks.map(l => (
              <li className="nav-item" key={l.href}>
                <a
                  className={`nav-link d-flex align-items-center gap-1${isActive(l.href) ? " active" : ""}`}
                  href={l.href}
                >
                  <i className={`bi ${l.icon} d-lg-none d-xl-inline`} style={{fontSize:"0.85rem"}}></i>
                  {l.label}
                </a>
              </li>
            ))}

          </ul>

          {/* Auth */}
          <div className="nav-auth ms-lg-3 mt-3 mt-lg-0 d-flex gap-2 align-items-center flex-wrap">
            {auth?.user ? (
              <>
                <div className="d-flex align-items-center gap-2 px-2 py-1 neon-card" style={{borderRadius:8}}>
                  <span className="pulse-dot"></span>
                  <span className="small" style={{color:"var(--muted)"}}>
                    <b className="neon" style={{fontFamily:"Orbitron, monospace", fontSize:"0.8rem"}}>
                      {auth.user.name || auth.user.username || auth.user.email?.split("@")[0]}
                    </b>
                    {isAdmin && (
                      <span className="pill ms-2" style={{fontSize:"0.58rem"}}>ADMIN</span>
                    )}
                  </span>
                </div>
                <button className="btn btn-neon btn-sm" onClick={onLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i>Kijelentkezés
                </button>
              </>
            ) : (
              <>
                <a className="btn btn-neon btn-sm" href="#/login">
                  <i className="bi bi-person-check me-1"></i>Login
                </a>
                <a className="btn btn-neon btn-sm" href="#/register" style={{
                  background:"rgba(184,75,255,.12)",
                  borderColor:"rgba(184,75,255,.3)"
                }}>
                  <i className="bi bi-person-plus me-1"></i>Register
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

window.NGH.components.Footer = function Footer(){
  return (
    <footer>
      <div className="container">
        <div className="row g-4 align-items-center">
          <div className="col-md-4">
            <div className="footer-brand neon mb-1">
              <i className="bi bi-controller me-2"></i>Cyber Hub
            </div>
            <div className="small-muted">Free-to-Play játékok · Hírek · GOTY · Közösség</div>
          </div>
          <div className="col-md-4 text-md-center">
            <div className="d-flex gap-3 justify-content-md-center mb-2">
              <a href="#/games" className="small-muted hover-neon">Játékok</a>
              <a href="#/news"  className="small-muted hover-neon">Hírek</a>
              <a href="#/goty"  className="small-muted hover-neon">GOTY</a>
              <a href="#/wall"  className="small-muted hover-neon">Fal</a>
            </div>
            {/* ↓ FEJLESZTŐK NEVE IDE — szerkeszd a "Név1, Név2" részt */}
            <div className="small-muted" style={{fontSize:"0.78rem"}}>
              Fejlesztők: <span className="neon">Gagyi Attla, Szabó Patrik, Magyar Levente</span>
            </div>
          </div>
          <div className="col-md-4 text-md-end">
            <div className="small-muted">
              <span className="pulse-dot me-2"></span>
              React 18 · Express · MySQL · Stripe
            </div>
            <div className="small-muted mt-1" style={{fontSize:"0.75rem"}}>
              &copy; {new Date().getFullYear()} Cyber Hub
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};