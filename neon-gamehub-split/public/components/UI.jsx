/**
 * components/UI.jsx
 * -----------------
 * Újrahasznosítható UI elemek:
 * - SectionTitle: címsor ikon+szöveg
 * - Hero: fő hero blokk
 * - AnimatedChart: Chart.js demo
 * - QuickLinks: gyors kártya linkek
 */
window.NGH = window.NGH || {};
window.NGH.components = window.NGH.components || {};

/**
 * Toast helper (Bootstrap Toast) — jobb felső sarokban kis értesítés.
 * Használat: window.NGH.toast("Üzenet törölve!");
 */
window.NGH.toast = function toast(message, opts = {}){
  // opts.position: "tr" (top-right) vagy "br" (bottom-right)
  const position = opts.position || "tr";
  try {
    const holderClass = position === "br" ? "toast-holder toast-holder--br" : "toast-holder toast-holder--tr";
    let holder = document.querySelector(`.${holderClass.split(" ").join(".")}`);
    if (!holder) {
      holder = document.createElement("div");
      holder.className = holderClass;
      document.body.appendChild(holder);
    }

    const el = document.createElement("div");
    el.className = "toast neon-toast toast align-items-center show";
    el.setAttribute("role","alert");
    el.setAttribute("aria-live","assertive");
    el.setAttribute("aria-atomic","true");
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body"><i class="bi bi-check2-circle me-2 text-info"></i>${String(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    holder.appendChild(el);

    const t = new bootstrap.Toast(el, { delay: 2200 });
    t.show();
    setTimeout(() => { try { el.remove(); } catch {} }, 2600);
  } catch {
    console.log(message);
  }
};


const { useEffect, useRef } = React;

window.NGH.components.SectionTitle = function SectionTitle({icon, title, subtitle}){
  return (
    <div className="d-flex align-items-end justify-content-between mb-2">
      <div>
        <div className="d-flex align-items-center gap-2">
          <i className={`bi ${icon} text-info fs-4`}></i>
          <h2 className="h4 mb-0 neon">{title}</h2>
        </div>
        {subtitle && <div className="small-muted">{subtitle}</div>}
      </div>
    </div>
  );
};

window.NGH.components.Hero = function Hero(){
  return (
    <div className="hero border-neon p-4 p-lg-5 mb-4 slide-in">
      <div className="row align-items-center g-4">
        <div className="col-lg-7">
          <span className="badge rounded-pill mb-3"><i className="bi bi-lightning-charge me-1"></i>Cyber Neon • React + Express</span>
          <h1 className="display-6 fw-bold neon mb-2">Játékok, hírek, GOTY és üzenőfal — egy menő, működő oldalban.</h1>
          <p className="lead small-muted mb-4">
            FreeToGame API-val játéklista, több gaming oldal RSS hírei, tokenes bejelentkezés, admin GOTY/Topic kezelés, és közösségi üzenőfal.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <a href="#/games" className="btn btn-neon"><i className="bi bi-rocket-takeoff me-2"></i>Játékok böngészése</a>
            <a href="#/goty" className="btn btn-outline-light"><i className="bi bi-trophy me-2"></i>GOTY timeline</a>
            <a href="#/wall" className="btn btn-outline-light"><i className="bi bi-chat-dots me-2"></i>Üzenőfal</a>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="neon-card p-3 glow2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="small-muted">Gyors tippek</div>
                <div className="fw-semibold">Próbáld ki az admin funkciókat is!</div>
              </div>
              <i className="bi bi-shield-lock fs-2 text-info"></i>
            </div>
            <hr className="border-secondary"/>
            <ul className="small-muted mb-0">
              <li>Admin login: <b>admin</b> / <b>admin123</b></li>
              <li>GOTY/Weekly topic szerkesztés az oldalak tetején (admin űrlapok)</li>
              <li>Üzenet írás: login után (különben 401)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

window.NGH.components.AnimatedChart = function AnimatedChart(){
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const api = window.NGH.lib.api;

  useEffect(() => {
    (async () => {
      // Valós (demo) adat: üzenetek száma az elmúlt 7 napban
      let counts = Array(7).fill(0);
      let labels = [];
      try {
        const msgs = await api("/api/messages");
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toISOString().slice(0,10);
          labels.push(d.toLocaleDateString("hu-HU", { weekday:"short" }));
          counts[6 - i] = msgs.filter(x => new Date(x.createdAt).toISOString().slice(0,10) === key).length;
        }
      } catch {
        labels = ["H","K","Sze","Cs","P","Szo","V"];
        counts = [1,2,1,3,4,2,3];
      }

      const ctx = canvasRef.current.getContext("2d");
      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Üzenetek / nap (elmúlt 7 nap)",
            data: counts,
            tension: 0.35,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#e8f2ff" } } },
          scales: {
            x: { ticks: { color: "#9bb2d3" }, grid: { color: "rgba(55,182,255,.08)" } },
            y: { ticks: { color: "#9bb2d3" }, grid: { color: "rgba(184,75,255,.07)" }, beginAtZero: true }
          }
        }
      });
    })();
  }, []);

  const SectionTitle = window.NGH.components.SectionTitle;
  return (
    <div className="neon-card p-3 glow">
      <SectionTitle icon="bi-graph-up" title="Animált diagram" subtitle="Valós adat: üzenetek száma az elmúlt 7 napban"/>
      <canvas ref={canvasRef} height="160"></canvas>
      <div className="small-muted mt-2">
        Ez már nem csak random demo: a /api/messages alapján számoljuk ki a napi aktivitást.
      </div>
    </div>
  );
};

window.NGH.components.QuickLinks = function QuickLinks(){
  // A "Gyors linkek" helyett: Community Pulse / Statisztikák
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;

  const { useEffect, useState } = React;
  const [msgCount, setMsgCount] = useState(0);
  const [topic, setTopic] = useState(null);
  const [favCount, setFavCount] = useState(() => JSON.parse(localStorage.getItem("fav") || "[]").length);

  useEffect(() => {
    const onStorage = () => setFavCount(JSON.parse(localStorage.getItem("fav") || "[]").length);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const msgs = await api("/api/messages");
        setMsgCount(msgs.length);
      } catch {}
      try {
        const t = await api("/api/weekly-topics/current");
        setTopic(t);
      } catch {}
    })();
  }, []);

  return (
    <div className="neon-card p-3 glow2">
      <SectionTitle icon="bi-activity" title="Community Pulse" subtitle="Kis dashboard a közösségi állapotról"/>
      <div className="row g-2">
        <div className="col-6">
          <div className="neon-card p-3 h-100">
            <div className="small-muted"><i className="bi bi-heart me-1 text-danger"></i>Kedvencek</div>
            <div className="display-6 fw-bold neon mb-0">{favCount}</div>
            <div className="small-muted">localStorage alapú (demo)</div>
          </div>
        </div>
        <div className="col-6">
          <div className="neon-card p-3 h-100">
            <div className="small-muted"><i className="bi bi-chat-dots me-1 text-info"></i>Üzenetek</div>
            <div className="display-6 fw-bold neon mb-0">{msgCount}</div>
            <div className="small-muted">összes publikus üzenet</div>
          </div>
        </div>
        <div className="col-12">
          <div className="neon-card p-3">
            <div className="small-muted"><i className="bi bi-calendar2-week me-1"></i>Heti téma</div>
            <div className="fw-semibold neon">{topic?.title || "Betöltés..."}</div>
            <div className="small-muted">Tipp: írj róla a Üzenőfalon!</div>
            <div className="d-flex gap-2 mt-2 flex-wrap">
              <a className="btn btn-neon btn-sm" href="#/wall"><i className="bi bi-chat-right-text me-1"></i>Üzenőfal</a>
              <a className="btn btn-outline-light btn-sm" href="#/news"><i className="bi bi-newspaper me-1"></i>Összes hír</a>
              <a className="btn btn-outline-light btn-sm" href="#/games"><i className="bi bi-grid me-1"></i>Játékok</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
