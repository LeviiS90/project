/**
 * Főoldal:
 * - Top games slider: GET /api/games?platform=pc&sort-by=popularity
 * - News: GET /api/news?provider=rss|newsapi|gnews&limit=12
 * - Chart.js: animált "pulse"
 */
import { api } from "./api.js";

export async function initHome() {
  wireSliderButtons();
  wireNewsControls();

  await Promise.allSettled([loadTopGames(), loadNews(false), initChart()]);
  document.getElementById("year").textContent = new Date().getFullYear();
}

async function loadTopGames() {
  const track = document.getElementById("sliderTrack");
  if (!track) return;

  track.innerHTML = skeletonCards(6);

  const games = await api.request("/api/games?platform=pc&sort-by=popularity");
  const top = Array.isArray(games) ? games.slice(0, 10) : [];

  track.innerHTML = "";
  for (const g of top) {
    const card = document.createElement("div");
    card.className = "cyber-card";
    card.style.minWidth = "280px";
    card.innerHTML = `
      <img src="${esc(g.thumbnail)}" class="w-100" style="height:150px;object-fit:cover" alt="">
      <div class="p-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="fw-bold">${esc(g.title)}</div>
          <span class="neon-pill">${esc(g.genre)}</span>
        </div>
        <div class="small-muted mt-2" style="min-height:44px">
          ${esc((g.short_description || "").slice(0, 90))}${(g.short_description||"").length>90?"…":""}
        </div>
        <div class="d-flex gap-2 mt-3">
          <a class="neon-btn flex-fill" href="/games.html#id=${encodeURIComponent(g.id)}">
            <i class="bi bi-search"></i> Részletek
          </a>
          <a class="neon-btn flex-fill" href="${esc(g.game_url)}" target="_blank" rel="noreferrer">
            <i class="bi bi-box-arrow-up-right"></i> Official
          </a>
        </div>
      </div>
    `;
    track.appendChild(card);
    animateIn(card);
  }

  track.style.scrollSnapType = "x mandatory";
  [...track.children].forEach((el) => (el.style.scrollSnapAlign = "start"));
}

function wireSliderButtons() {
  const track = document.getElementById("sliderTrack");
  const prev = document.getElementById("slidePrev");
  const next = document.getElementById("slideNext");
  if (!track) return;

  prev?.addEventListener("click", () => track.scrollBy({ left: -320, behavior: "smooth" }));
  next?.addEventListener("click", () => track.scrollBy({ left: 320, behavior: "smooth" }));

  track.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollBy({ left: e.deltaY > 0 ? 260 : -260, behavior: "smooth" });
      }
    },
    { passive: false }
  );
}

async function loadNews(force) {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;

  const provider = getProvider();
  const limit = 12;

  grid.innerHTML = skeletonNews(6);

  const qs = new URLSearchParams();
  qs.set("provider", provider);
  qs.set("limit", String(limit));
  if (force) qs.set("_t", String(Date.now()));

  try {
    const items = await api.request(`/api/news?${qs.toString()}`);
    grid.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = emptyState("Nincs hír most", "Próbáld újra, vagy válts provider-t.");
      return;
    }

    for (const n of items) {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";

      const imgHtml = n.image
        ? `<img src="${esc(n.image)}" class="w-100 mb-2" style="height:160px;object-fit:cover;border-radius:14px" alt="">`
        : "";

      col.innerHTML = `
        <div class="cyber-card p-3 h-100">
          ${imgHtml}
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="neon-pill">${esc(n.source || "News")}</span>
            <span class="small-muted">${esc((n.published || "").slice(0, 10))}</span>
          </div>
          <div class="fw-bold mb-2">${esc(n.title || "")}</div>
          <div class="small-muted mb-3">${esc(n.snippet || "")}</div>
          <a class="neon-btn w-100 text-center" href="${esc(n.link || "#")}" target="_blank" rel="noreferrer">
            <i class="bi bi-newspaper"></i> Megnyitás
          </a>
        </div>
      `;
      grid.appendChild(col);
      animateIn(col, { delayMs: 20 });
    }
  } catch (e) {
    grid.innerHTML = emptyState("Hiba a hírek betöltésekor", String(e.message || e));
  }
}

function wireNewsControls() {
  document.getElementById("refreshNews")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadNews(true);
  });

  // Opcionális: provider dropdown (ha beleteszed)
  document.getElementById("newsProvider")?.addEventListener("change", (e) => {
    localStorage.setItem("newsProvider", e.target.value);
    loadNews(true);
  });
}

function getProvider() {
  const sel = document.getElementById("newsProvider");
  if (sel?.value) return String(sel.value).toLowerCase();
  return (localStorage.getItem("newsProvider") || "rss").toLowerCase();
}

async function initChart() {
  const canvas = document.getElementById("pulseChart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = Array.from({ length: 14 }, (_, i) => `T-${13 - i}`);
  const data = labels.map(() => rand(20, 90));

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Hype level", data, tension: 0.35 }]
    },
    options: {
      responsive: true,
      animation: { duration: 900 },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#a8b3e6" } },
        y: { grid: { color: "rgba(120,160,255,.12)" }, ticks: { color: "#a8b3e6" }, suggestedMin: 0, suggestedMax: 100 }
      }
    }
  });

  setInterval(() => {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(rand(18, 96));
    chart.update();
  }, 1400);
}

function skeletonCards(n) {
  return Array.from({ length: n })
    .map(
      () => `
    <div class="cyber-card p-3" style="min-width:280px">
      <div style="height:250px;border-radius:14px;background:rgba(255,255,255,.06)"></div>
    </div>
  `
    )
    .join("");
}

function skeletonNews(n) {
  return Array.from({ length: n })
    .map(
      () => `
    <div class="col-md-6 col-lg-4">
      <div class="cyber-card p-3">
        <div style="height:160px;border-radius:14px;background:rgba(255,255,255,.06)" class="mb-2"></div>
        <div style="height:14px;width:55%;background:rgba(255,255,255,.08);border-radius:8px" class="mb-2"></div>
        <div style="height:18px;width:90%;background:rgba(255,255,255,.08);border-radius:8px" class="mb-2"></div>
        <div style="height:14px;width:100%;background:rgba(255,255,255,.06);border-radius:8px" class="mb-3"></div>
        <div style="height:44px;width:100%;background:rgba(0,229,255,.10);border:1px solid rgba(0,229,255,.25);border-radius:14px"></div>
      </div>
    </div>
  `
    )
    .join("");
}

function emptyState(title, desc) {
  return `
    <div class="col-12">
      <div class="cyber-card p-4">
        <div class="fw-bold mb-1">${esc(title)}</div>
        <div class="small-muted">${esc(desc)}</div>
      </div>
    </div>
  `;
}

function animateIn(el, { delayMs = 0 } = {}) {
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
  el.style.transition = "opacity .35s ease, transform .35s ease";
  setTimeout(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  }, delayMs);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
  });
}
