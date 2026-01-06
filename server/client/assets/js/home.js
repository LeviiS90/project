import { api } from "./api.js";

export async function initHome() {
  await Promise.all([loadTopGames(), loadNews(), initChart()]);
  wireSliderButtons();
  document.getElementById("refreshNews")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadNews(true);
  });
}

async function loadTopGames() {
  const track = document.getElementById("sliderTrack");
  track.innerHTML = "";

  const games = await api.request("/api/games?platform=pc&sort-by=popularity");
  const top = games.slice(0, 10);

  for (const g of top) {
    const card = document.createElement("div");
    card.className = "cyber-card";
    card.style.minWidth = "280px";
    card.innerHTML = `
      <img src="${escapeHtml(g.thumbnail)}" class="w-100" style="height:150px;object-fit:cover" alt="">
      <div class="p-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="fw-bold">${escapeHtml(g.title)}</div>
          <span class="neon-pill">${escapeHtml(g.genre)}</span>
        </div>
        <div class="small-muted mt-2" style="min-height:44px">${escapeHtml((g.short_description||"").slice(0, 80))}…</div>
        <div class="d-flex gap-2 mt-3">
          <a class="neon-btn" href="/games.html#id=${g.id}"><i class="bi bi-search me-2"></i>Részletek</a>
          <a class="neon-btn" href="${escapeHtml(g.game_url)}" target="_blank" rel="noreferrer">
            <i class="bi bi-box-arrow-up-right me-2"></i>Official
          </a>
        </div>
      </div>
    `;
    track.appendChild(card);
  }
}

function wireSliderButtons() {
  const track = document.getElementById("sliderTrack");
  const prev = document.getElementById("slidePrev");
  const next = document.getElementById("slideNext");

  prev?.addEventListener("click", () => track.scrollLeft -= 320);
  next?.addEventListener("click", () => track.scrollLeft += 320);
}

async function loadNews(force = false) {
  const grid = document.getElementById("newsGrid");
  grid.innerHTML = "";

  const items = await api.request("/api/news?limit=12");
  for (const n of items) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";
    col.innerHTML = `
      <div class="cyber-card p-3 h-100">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="neon-pill">${escapeHtml(n.source)}</span>
          <span class="small-muted">${escapeHtml((n.published||"").slice(0,10))}</span>
        </div>
        <div class="fw-bold mb-2">${escapeHtml(n.title)}</div>
        <div class="small-muted mb-3">${escapeHtml(n.snippet || "")}</div>
        <a class="neon-btn w-100 text-center" href="${escapeHtml(n.link)}" target="_blank" rel="noreferrer">
          <i class="bi bi-newspaper me-2"></i>Megnyitás
        </a>
      </div>
    `;
    grid.appendChild(col);
  }
}

async function initChart() {
  const ctx = document.getElementById("pulseChart");
  if (!ctx) return;

  const labels = Array.from({ length: 12 }, (_, i) => `T-${11 - i}`);
  const data = labels.map(() => rand(20, 90));

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Hype level",
        data,
        tension: 0.35
      }]
    },
    options: {
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
    chart.data.datasets[0].data.push(rand(20, 95));
    chart.update();
  }, 1400);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
