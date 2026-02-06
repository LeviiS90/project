/**
 * components/Layout.jsx
 * ---------------------
 * Layout elemek:
 * - Navbar (offcanvas + dropdown "rolldown")
 * - Footer
 */
window.NGH = window.NGH || {};
window.NGH.components = window.NGH.components || {};

window.NGH.components.Navbar = function Navbar({auth, onLogout}){
  const isAdmin = auth?.user?.role === "admin";
  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
      <div className="container">
        <a className="navbar-brand fw-bold neon" href="#/home">
          <i className="bi bi-controller me-2"></i>Neon GameHub
        </a>

        {/* Bootstrap COLLAPSE (stabilabb, mint az offcanvas) */}
        <button
          className="navbar-toggler"
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
          <ul className="navbar-nav ms-lg-auto gap-lg-1">
            <li className="nav-item"><a className="nav-link" href="#/home">Főoldal</a></li>
            <li className="nav-item"><a className="nav-link" href="#/games">Népszerű játékok</a></li>
            <li className="nav-item"><a className="nav-link" href="#/news">Hírek</a></li>
            <li className="nav-item"><a className="nav-link" href="#/goty">Az év játéka (10 év)</a></li>
            <li className="nav-item"><a className="nav-link" href="#/wall">Üzenőfal</a></li>

            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Extra
              </a>
              <ul className="dropdown-menu dropdown-menu-dark">
                <li><a className="dropdown-item" href="#/support"><i className="bi bi-life-preserver me-2"></i>Support / Contact</a></li>
                <li><a className="dropdown-item" href="https://www.thegameawards.com/" target="_blank" rel="noreferrer">
                  <i className="bi bi-trophy me-2"></i>GOTY (hivatalos)
                </a></li>
                <li><a className="dropdown-item" href="https://en.bandainamcoent.eu/elden-ring/elden-ring" target="_blank" rel="noreferrer">
                  <i className="bi bi-stars me-2"></i>Inspo (Elden Ring)
                </a></li>
              </ul>
            </li>
          </ul>

          <div className="nav-auth ms-lg-3 mt-3 mt-lg-0 d-flex gap-2 align-items-center">
            {auth?.user ? (
              <>
                <span className="small-muted">
                  Bejelentkezve: <b className="neon">{auth.user.username}</b>
                  {isAdmin && <span className="ms-2 pill">ADMIN</span>}
                </span>
                <button className="btn btn-neon btn-sm" onClick={onLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i>Kijelentkezés
                </button>
              </>
            ) : (
              <>
                <a className="btn btn-neon btn-sm" href="#/login"><i className="bi bi-person-check me-1"></i>Login</a>
                <a className="btn btn-neon btn-sm" href="#/register"><i className="bi bi-person-plus me-1"></i>Register</a>
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
    <footer className="footer mt-5">
      <div className="container py-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-6">
            <div className="fw-semibold neon"><i className="bi bi-code-slash me-2"></i>Fejlesztők</div>
            <div className="small-muted">Demo projekt • React (JSX) + Express REST API • Cyber Neon UI</div>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="small-muted">Elérhetőség: <span className="neon">support@neongamehub.local</span></div>
            <div className="small-muted">© {new Date().getFullYear()} Neon GameHub</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
