/**
 * home.js — TELJES, működő “Home” logika a backend API-kkal
 *
 * Használt végpontok:
 * - GET  /api/games?platform=pc&sort-by=popularity   -> Top játékok sliderhez
 * - GET  /api/news?provider=rss|newsapi|gnews&limit= -> Friss hírek (egységes JSON)
 *
 * Elvárt HTML elemek az index.html-ben:
 * - #sliderTrack  (div: ide mennek a top játék kártyák)
 * - #slidePrev    (button)
 * - #slideNext    (button)
 * - #newsGrid     (div.row: ide mennek a hírkártyák)
 * - #refreshNews  (a[href]/button)
 * - #pulseChart   (canvas)
 *
 * Opcionális (ha berakod a menübe):
 * - #newsProvider (select: rss/newsapi/gnews)
 * - #newsStatus   (div: státusz sor)
 */

import { api } from "./api.js";

export async function initHome() {
  // 1) UI drótok (gombok, provider, parancsok)
  wireSliderButtons();
  wireNewsControls();

  // 2) Első betöltés
  await Promise.allSettled([loadTopGames(), loadNews(), initChart()]);

  // 3) Kis “belépő” anim érzés: első load után
  revealOnLoad();
}

/* -------------------------------------------------------------------------- */
/* TOP GAMES SLIDER                                                           */
/* -------------------------------------------------------------------------- */

async function loadTopGames() {
  const track = byId("sliderTrack");
  if (!track) return;

  track.innerHTML = skeletonCards(6, { minWidth: 280, height: 270 });

  // FreeToGame: top játékok popularity szerint
  const games = await api.request("/api/games?platform=pc&sort-by=popularity");

  const top = Array.isArray(games) ? games.slice(0, 10) : [];
  track.innerHTML = "";

  for (const g of top) {
    const card = document.createElement("div");
    card.className = "cyber-card hover-pop";
    card.style.minWidth = "280px";

    // Kattintás: games.html#id=xxx
    card.innerHTML = `
      <img src="${esc(g.thumbnail)}" class="w-100" style="height:150px;object-fit:cover" alt="">
      <div class="p-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="fw-bold">${esc(g.title)}</div>
          <span class="neon-pill">${esc(g.genre)}</span>
        </div>
        <div class="small-muted mt-2" style="min-height:44px">
          ${esc((g.short_description || "").slice(0, 90))}${(g.short_description || "").length > 90 ? "…" : ""}
        </div>

        <div class="d-flex gap-2 mt-3">
          <a class="neon-btn flex-fill text-center" href="/games.html#id=${encodeURIComponent(g.id)}">
            <i class="bi bi-search me-2"></i>Részletek
          </a>
          <a class="neon-btn flex-fill text-center" href="${esc(g.game_url)}" target="_blank" rel="noreferrer">
            <i class="bi bi-box-arrow-up-right me-2"></i>Official
          </a>
        </div>
      </div>
    `;

    track.appendChild(card);
    animateIn(card);
  }

  // Ha kevés kártya van, görgetés helyett “snap” élmény
  track.style.scrollSnapType = "x mandatory";
  [...track.children].forEach((el) => (el.style.scrollSnapAlign = "start"));
}

function wireSliderButtons() {
  const track = byId("sliderTrack");
  const prev = byId("slidePrev");
  const next = byId("slideNext");

  if (!track) return;

  prev?.addEventListener("click", () => smoothScroll(track, -320));
  next?.addEventListener("click", () => smoothScroll(track, +320));

  // Egérgörgő vízszintessé (jó “menő” élmény)
  track.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        smoothScroll(track, e.deltaY > 0 ? +260 : -260);
      }
    },
    { passive: false }
  );
}

function smoothScroll(el, delta) {
  el.scrollBy({ left: delta, behavior: "smooth" });
}

/* -------------------------------------------------------------------------- */
/* NEWS                                                                        */
/* -------------------------------------------------------------------------- */

async function loadNews(force = false) {
  const grid = byId("newsGrid");
  if (!grid) return;

  const provider = getProvider(); // rss/newsapi/gnews
  const limit = 12;

  setNewsStatus(`Hírek betöltése… (${provider.toUpperCase()})`);

  grid.innerHTML = skeletonNews(6);

  // Cache breaker (ha a backend cache-el, a "force" igazából UI-s élmény)
  // A szerver oldalon van cache, de itt is meg tudjuk mozgatni a UI-t.
  const qs = new URLSearchParams();
  qs.set("provider", provider);
  qs.set("limit", String(limit));
  if (force) qs.set("_t", String(Date.now()));

  try {
    const items = await api.request(`/api/news?${qs.toString()}`);

    grid.innerHTML = "";
    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = emptyState(
        "Nincs hír most",
        "Próbáld újra, vagy válts provider-t (RSS / NewsAPI / GNews)."
      );
      setNewsStatus("Nem jött vissza hír (0 db).");
      return;
    }

    for (const n of items) {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";

      const date = formatDate(n.published);
      const img = n.image
        ? `<img src="${esc(n.image)}" class="w-100 mb-2" style="height:160px;object-fit:cover;border-radius:14px" alt="">`
        : "";

      col.innerHTML = `
        <div class="cyber-card p-3 h-100">
          ${img}
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="neon-pill">${esc(n.source || "News")}</span>
            <span class="small-muted">${esc(date)}</span>
          </div>
          <div class="fw-bold mb-2">${esc(n.title || "")}</div>
          <div class="small-muted mb-3">${esc(n.snippet || "")}</div>

          <a class="neon-btn w-100 text-center" href="${esc(n.link || "#")}" target="_blank" rel="noreferrer">
            <i class="bi bi-newspaper me-2"></i>Megnyitás
          </a>
        </div>
      `;

      grid.appendChild(col);
      animateIn(col, { delayMs: 30 });
    }

    setNewsStatus(`Kész: ${items.length} hír (${provider.toUpperCase()}).`);
  } catch (e) {
    grid.innerHTML = emptyState("Hiba a hírek betöltésekor", String(e.message || e));
    setNewsStatus(`Hiba: ${String(e.message || e)}`);
  }
}

function wireNewsControls() {
  byId("refreshNews")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadNews(true);
  });

  // Opcionális provider választó (ha raksz a UI-ba egy selectet)
  byId("newsProvider")?.addEventListener("change", () => loadNews(true));
}

function getProvider() {
  // 1) UI select felülírhatja
  const sel = byId("newsProvider");
  if (sel && sel.value) return String(sel.value).toLowerCase();

  // 2) Mentett preferencia
  const saved = localStorage.getItem("newsProvider");
  if (saved) return String(saved).toLowerCase();

  // 3) Default
  return "rss";
}

function setNewsStatus(text) {
  const el = byId("newsStatus");
  if (!el) return;
  el.textContent = text;
}

/* -------------------------------------------------------------------------- */
/* CHART (Chart.js)                                                           */
/* -------------------------------------------------------------------------- */

async function initChart() {
  const canvas = byId("pulseChart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = Array.from({ length: 14 }, (_, i) => `T-${13 - i}`);
  const data = labels.map(() => rand(20, 90));

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Hype level",
          data,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 900 },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#a8b3e6" } },
        y: {
          grid: { color: "rgba(120,160,255,.12)" },
          ticks: { color: "#a8b3e6" },
          suggestedMin: 0,
          suggestedMax: 100
        }
      }
    }
  });

  // Élő “pulse” frissítés
  setInterval(() => {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(rand(18, 96));
    chart.update();
  }, 1400);
}

/* -------------------------------------------------------------------------- */
/* UI HELPERS (anim + skeleton)                                               */
/* -------------------------------------------------------------------------- */

function revealOnLoad() {
  // Finom “fade-in” a fő kontentnek, ha van rá class
  document.querySelectorAll(".reveal").forEach((el) => animateIn(el));
}

function animateIn(el, { delayMs = 0 } = {}) {
  // Egyszerű, dependency nélküli anim
  el.style.opacity = "0";
  el.style.transform = "translateY(10px)";
  el.style.transition = "opacity .35s ease, transform .35s ease";
  setTimeout(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  }, delayMs);
}

function skeletonCards(n, { minWidth = 280, height = 260 } = {}) {
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push(`
      <div class="cyber-card p-3" style="min-width:${minWidth}px">
        <div style="height:${height}px; border-radius:14px; background: rgba(255,255,255,.06)"></div>
      </div>
    `);
  }
  return items.join("");
}

function skeletonNews(n) {
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push(`
      <div class="col-md-6 col-lg-4">
        <div class="cyber-card p-3">
          <div style="height:160px; border-radius:14px; background: rgba(255,255,255,.06)" class="mb-2"></div>
          <div style="height:14px; width:55%; background: rgba(255,255,255,.08); border-radius:8px" class="mb-2"></div>
          <div style="height:18px; width:90%; background: rgba(255,255,255,.08); border-radius:8px" class="mb-2"></div>
          <div style="height:14px; width:100%; background: rgba(255,255,255,.06); border-radius:8px" class="mb-2"></div>
          <div style="height:14px; width:86%; background: rgba(255,255,255,.06); border-radius:8px" class="mb-3"></div>
          <div style="height:44px; width:100%; background: rgba(0,229,255,.10); border: 1px solid rgba(0,229,255,.25); border-radius:14px"></div>
        </div>
      </div>
    `);
  }
  return items.join("");
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

/* -------------------------------------------------------------------------- */
/* UTILS                                                                       */
/* -------------------------------------------------------------------------- */

function byId(id) {
  return document.getElementById(id);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(iso) {
  if (!iso) return "";
  // csak “YYYY-MM-DD” a minimalista UI-hoz
  return String(iso).slice(0, 10);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
  });
}
