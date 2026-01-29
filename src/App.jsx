import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import News from "./pages/News.jsx";
import Games from "./pages/Games.jsx";
import Goty from "./pages/Goty.jsx";
import Wall from "./pages/Wall.jsx";
import Support from "./pages/Support.jsx";
import Login from "./pages/Login.jsx";

function Layout({ children }) {
  return (
    <>
      <nav className="navbar navbar-expand-lg neon-nav">
        <div className="ngh-shell">
          <NavLink className="navbar-brand" to="/">⚡ Neon Gaming Hub</NavLink>

          <button
            className="navbar-toggler neon-btn-outline btn btn-sm"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#nav"
          >
            Menu
          </button>

          <div className="collapse navbar-collapse" id="nav">
            <div className="navbar-nav ms-auto gap-2 mt-3 mt-lg-0">
              <NavLink className="nav-link" to="/">Főoldal</NavLink>
              <NavLink className="nav-link" to="/news">Hírek</NavLink>
              <NavLink className="nav-link" to="/games">Játékok</NavLink>
              <NavLink className="nav-link" to="/goty">GOTY</NavLink>
              <NavLink className="nav-link" to="/wall">Üzenőfal</NavLink>
              <NavLink className="nav-link" to="/support">Support</NavLink>
              <NavLink className="nav-link" to="/login">Login</NavLink>
            </div>
          </div>
        </div>
      </nav>

      {children}

      <footer className="ngh-shell text-center pb-5" style={{ opacity: 0.9 }}>
        <hr />
        <div>⚡ Neon Gaming Hub — React + Express REST API + JWT</div>
        <div style={{ fontSize: 12 }}>API: /api/* • Vite proxy: 5173 → 3000</div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/news"
            element={
              <main className="ngh-shell section">
                <News />
              </main>
            }
          />
          <Route
            path="/games"
            element={
              <main className="ngh-shell section">
                <Games />
              </main>
            }
          />
          <Route
            path="/goty"
            element={
              <main className="ngh-shell section">
                <Goty />
              </main>
            }
          />
          <Route
            path="/wall"
            element={
              <main className="ngh-shell section">
                <Wall />
              </main>
            }
          />
          <Route
            path="/support"
            element={
              <main className="ngh-shell section">
                <Support />
              </main>
            }
          />
          <Route
            path="/login"
            element={
              <main className="ngh-shell section">
                <Login />
              </main>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
