/**
 * components/UI.jsx
 * -----------------
 * Újrahasznosítható UI elemek:
 * - SectionTitle: szebb fejléc
 * - Hero: nagyobb, vizuálisan gazdagabb
 * - AnimatedChart
 * - QuickLinks (auth-aware: fav userenként, vendégnek "—")
 */
window.NGH = window.NGH || {};
window.NGH.components = window.NGH.components || {};

/**
 * Toast helper (Bootstrap Toast)
 */
window.NGH.toast = function toast(message, opts = {}){
  const position = opts.position || "tr";
  const type = opts.type || "info"; // info | success | error
  try {
    const holderClass = position === "br" ? "toast-holder toast-holder--br" : "toast-holder toast-holder--tr";
    let holder = document.querySelector(`.${holderClass.split(" ").join(".")}`);
    if (!holder) {
      holder = document.createElement("div");
      holder.className = holderClass;
      document.body.appendChild(holder);
    }

    const iconMap = { info: "bi-check2-circle text-info", success: "bi-check-circle-fill", error: "bi-x-circle text-danger" };
    const icon = iconMap[type] || iconMap.info;

    const el = document.createElement("div");
    el.className = "toast neon-toast align-items-center show";
    el.setAttribute("role","alert");
    el.setAttribute("aria-live","assertive");
    el.setAttribute("aria-atomic","true");
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i>
          <span>${String(message)}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    holder.appendChild(el);

    const t = new bootstrap.Toast(el, { delay: 2400 });
    t.show();
    setTimeout(() => { try { el.remove(); } catch {} }, 2800);
  } catch {
    console.log(message);
  }
};


const { useEffect, useRef, useState: useStateUI } = React;

/* ───────────────────────────────────────
   SectionTitle
─────────────────────────────────────── */
window.NGH.components.SectionTitle = function SectionTitle({icon, title, subtitle, action}){
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:36, height:36, borderRadius:10,
            background:"rgba(55,182,255,.1)",
            border:"1px solid rgba(55,182,255,.22)",
            color:"var(--neon)", fontSize:"1.1rem",
            flexShrink:0
          }}>
            <i className={`bi ${icon}`}></i>
          </span>
          <div>
            <h2 className="h5 mb-0 neon" style={{fontFamily:"Orbitron, monospace", fontSize:"1rem", letterSpacing:"0.06em"}}>
              {title}
            </h2>
            {subtitle && <div className="small-muted" style={{fontSize:"0.8rem"}}>{subtitle}</div>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="section-title-line mt-2" style={{width:80}}></div>
    </div>
  );
};

/* ───────────────────────────────────────
   Hero
─────────────────────────────────────── */
window.NGH.components.Hero = function Hero(){
  return (
    <div className="hero border-neon mb-4 slide-in">
      {/* Decorative corner elements */}
      <div style={{
        position:"absolute", top:16, right:20,
        fontFamily:"Orbitron, monospace", fontSize:"0.6rem",
        color:"rgba(54, 171, 248, 0.8)", letterSpacing:"0.15em",
        userSelect:"none"
      }}>
        SYSTEM::ONLINE ■■■■■□
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="badge">
              <i className="bi bi-lightning-charge me-1"></i>CYBER HUB v1.0
            </span>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:5,
              fontSize:"0.75rem", color:"var(--muted)"
            }}>
              <span className="pulse-dot"></span> LIVE
            </span>
          </div>

          <h1 className="display-6 fw-bold mb-3" style={{lineHeight:1.2}}>
            <span className="neon">Játékok </span> és Hírek egy helyen
            <br/> Maradj naprakész.
          </h1>

          <p className="mb-4" style={{color:"var(--muted)", fontSize:"1rem", lineHeight:1.7, maxWidth:560}}>
            RAWG API játéklista, 6 gaming oldal RSS hírei, és közösségi üzenőfal — ahol minden gamer otthon érzi magát.
          </p>

          <div className="d-flex flex-wrap gap-2">
            <a href="#/games" className="btn btn-neon">
              <i className="bi bi-rocket-takeoff me-2"></i>Játékok
            </a>
            <a href="#/goty" className="btn btn-outline-light">
              <i className="bi bi-trophy me-2"></i>GOTY timeline
            </a>
            <a href="#/wall" className="btn btn-outline-light">
              <i className="bi bi-chat-dots me-2"></i>Üzenőfal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────────────────────
   GenreChart – Játék műfajok donut
─────────────────────────────────────── */
window.NGH.components.AnimatedChart = function AnimatedChart(){
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const api = window.NGH.lib.api;
  const SectionTitle = window.NGH.components.SectionTitle;
  const [chartData, setChartData] = useStateUI(null);
  const [loading, setLoading] = useStateUI(true);

  // 1. fetch data
  useEffect(() => {
    (async () => {
      let genreMap = {};
      try {
        const data = await api("/api/games?platform=pc");
        data.forEach(g => {
          if (!g.genre) return;
          const genres = g.genre.split(",").map(s => s.trim());
          genres.forEach(genre => {
            if (!genre) return;
            genreMap[genre] = (genreMap[genre] || 0) + 1;
          });
        });
      } catch {
        genreMap = {
          "Action": 18, "RPG": 14, "Shooter": 12, "Adventure": 10,
          "Strategy": 8, "Indie": 7, "Sports": 5, "Puzzle": 4
        };
      }
      const sorted = Object.entries(genreMap).sort((a,b)=>b[1]-a[1]).slice(0,7);
      setChartData(sorted);
      setLoading(false);
    })();
  }, []);

  // 2. draw chart after data + canvas are both ready
  useEffect(() => {
    if (!chartData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) chartRef.current.destroy();

    const colors = [
      "rgba(55,182,255,.85)",  "rgba(184,75,255,.85)",
      "rgba(0,229,160,.85)",   "rgba(255,61,113,.85)",
      "rgba(255,193,7,.85)",   "rgba(255,120,50,.85)",
      "rgba(100,220,100,.85)",
    ];

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: chartData.map(([g]) => g),
        datasets: [{
          data: chartData.map(([,n]) => n),
          backgroundColor: colors.slice(0, chartData.length),
          borderColor: colors.slice(0, chartData.length).map(c => c.replace(".85","1")),
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#b0cce8",
              font: { family: "Rajdhani, sans-serif", size: 12 },
              padding: 8, boxWidth: 10, boxHeight: 10,
              usePointStyle: true, pointStyleWidth: 8,
            }
          },
          tooltip: {
            backgroundColor: "rgba(7,13,26,.95)",
            borderColor: "rgba(55,182,255,.25)", borderWidth: 1,
            titleColor: "#4cc9ff", bodyColor: "#f0f8ff",
            bodyFont: { family: "Rajdhani, sans-serif", size: 13 }, padding: 10,
            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} játék` }
          }
        },
        animation: { duration: 900, easing: "easeOutQuart" }
      }
    });
  }, [chartData]);

  return (
    <div className="neon-card p-3 glow">
      <SectionTitle icon="bi-pie-chart-fill" title="Játék Műfajok" subtitle="Műfaj-eloszlás a játékkatalógusban"/>
      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border text-info mb-2" style={{width:24, height:24, borderWidth:2}}></div>
          <div className="small-muted">Adatok betöltése...</div>
        </div>
      ) : (
        <div style={{position:"relative", height:220, width:"100%"}}>
          <canvas ref={canvasRef}></canvas>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────────────────
   QuickLinks / Community Pulse
   – auth prop alapján user-specifikus fav kulcs
─────────────────────────────────────── */
window.NGH.components.QuickLinks = function QuickLinks({ auth }){
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;
  const { useEffect, useState } = React;
  const [msgCount, setMsgCount] = useState("—");
  const [topic, setTopic] = useState(null);
  const [favCount, setFavCount] = useState(0);

  // Kedvencek száma: csak bejelentkezve, user-specifikus kulcsból
  useEffect(() => {
    const k = auth?.user?.id ? `fav_${auth.user.id}` : null;
    setFavCount(k ? JSON.parse(localStorage.getItem(k) || "[]").length : 0);

    const onFavChange = () => {
      const k2 = auth?.user?.id ? `fav_${auth.user.id}` : null;
      setFavCount(k2 ? JSON.parse(localStorage.getItem(k2) || "[]").length : 0);
    };
    window.addEventListener("favchange", onFavChange);
    return () => window.removeEventListener("favchange", onFavChange);
  }, [auth?.user?.id]);

  useEffect(() => {
    (async () => {
      try { const msgs = await api("/api/messages"); setMsgCount(msgs.length); } catch {}
      try { setTopic(await api("/api/weekly-topics/current")); } catch {}
    })();
  }, []);

  const stats = [
    {
      icon:"bi-heart-fill", color:"#ff3d71", label:"Kedvencek",
      value: auth?.user ? favCount : "—",
      sub: auth?.user ? "mentett játék" : "nem bejelentkezve",
      href:"#/games"
    },
    { icon:"bi-chat-fill", color:"#37b6ff", label:"Üzenetek", value: msgCount, sub:"összes", href:"#/wall" },
  ];

  return (
    <div className="neon-card p-3 glow2">
      <SectionTitle icon="bi-activity" title="Community Pulse" subtitle="Közösségi állapot"/>

      {/* Stats */}
      <div className="row g-2 mb-3">
        {stats.map(s => (
          <div className="col-6" key={s.label}>
            <a href={s.href} className="text-decoration-none">
              <div className="neon-card px-3 py-2 h-100" style={{
                border:"1px solid rgba(255,255,255,.05)",
                transition:"border-color .15s"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor="rgba(55,182,255,.2)"}
              onMouseLeave={e => e.currentTarget.style.borderColor="rgba(255,255,255,.05)"}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className={`bi ${s.icon}`} style={{color:s.color,fontSize:"0.85rem"}}></i>
                  <span className="small-muted" style={{fontSize:"0.72rem"}}>{s.label}</span>
                </div>
                <div className="stat-number" style={{fontSize:"1.4rem"}}>{s.value}</div>
                <div className="small-muted" style={{fontSize:"0.68rem"}}>{s.sub}</div>
              </div>
            </a>
          </div>
        ))}
      </div>

      {/* Heti téma */}
      <div className="neon-card px-3 py-2" style={{
        border:"1px solid rgba(55,182,255,.12)", background:"rgba(55,182,255,.03)"
      }}>
        <div className="d-flex align-items-center gap-2 mb-1">
          <i className="bi bi-calendar2-week" style={{color:"var(--neon)",fontSize:"0.85rem"}}></i>
          <span className="small-muted" style={{fontSize:"0.72rem",letterSpacing:"0.05em"}}>HETI TÉMA</span>
        </div>
        <div className="fw-semibold neon mb-2" style={{fontSize:"0.85rem",lineHeight:1.35}}>
          {topic?.title || <span style={{color:"var(--muted)"}}>Betöltés...</span>}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a className="btn btn-neon btn-sm" href="#/wall" style={{fontSize:"0.72rem"}}>
            <i className="bi bi-chat-right-text me-1"></i>Üzenőfal
          </a>
          <a className="btn btn-outline-light btn-sm" href="#/news" style={{fontSize:"0.72rem"}}>
            <i className="bi bi-newspaper me-1"></i>Hírek
          </a>
          <a className="btn btn-outline-light btn-sm" href="#/games" style={{fontSize:"0.72rem"}}>
            <i className="bi bi-grid me-1"></i>Játékok
          </a>
        </div>
      </div>
    </div>
  );
};
