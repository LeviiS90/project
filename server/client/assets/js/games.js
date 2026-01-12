import { api } from "./api.js";

export async function initGames() {
  updateFavCount();
  document.getElementById("apply")?.addEventListener("click", load);
  await load();

  const id = parseHashId();
  if (id) showDetails(id);
}

async function load() {
  const platform = document.getElementById("platform").value;
  const genre = document.getElementById("genre").value;
  const sortBy = document.getElementById("sortBy").value;

  const qs = new URLSearchParams();
  if (platform && platform !== "all") qs.set("platform", platform);
  if (genre) qs.set("category", genre.toLowerCase());
  if (sortBy) qs.set("sort-by", sortBy);

  const list = await api.request(`/api/games?${qs.toString()}`);
  render(Array.isArray(list) ? list.slice(0, 24) : []);
}

function render(list) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  document.getElementById("resultCount").textContent = `${list.length} találat (top 24)`;

  for (const g of list) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-xl-4";
    col.innerHTML = `
      <div class="cyber-card h-100">
        <img src="${esc(g.thumbnail)}" class="w-100" style="height:160px;object-fit:cover" alt="">
        <div class="p-3">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="fw-bold">${esc(g.title)}</div>
            <span class="neon-pill">${esc(g.platform)}</span>
          </div>
          <div class="small-muted mt-2" style="min-height:48px">
            ${esc((g.short_description||"").slice(0, 90))}${(g.short_description||"").length>90?"…":""}
          </div>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button class="neon-btn" data-details="${g.id}">
              <i class="bi bi-info-circle"></i> Részletek
            </button>
            <button class="neon-btn" data-fav="${g.id}">
              <i class="bi bi-heart"></i> Kedvencekhez
            </button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  }

  grid.querySelectorAll("[data-fav]").forEach(btn => {
    btn.addEventListener("click", () => addFav(btn.getAttribute("data-fav")));
  });

  grid.querySelectorAll("[data-details]").forEach(btn => {
    btn.addEventListener("click", () => showDetails(btn.getAttribute("data-details")));
  });
}

async function showDetails(id) {
  const g = await api.request(`/api/games/${id}`);

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,.65)";
  overlay.style.backdropFilter = "blur(6px)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "grid";
  overlay.style.placeItems = "center";

  overlay.innerHTML = `
    <div class="cyber-card p-3 p-lg-4" style="max-width:900px;width:92vw">
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div>
          <div class="neon-pill mb-2">${esc(g.genre)} • ${esc(g.platform)}</div>
          <div class="h4 fw-bold mb-1">${esc(g.title)}</div>
          <div class="small-muted">Fejlesztő: ${esc(g.developer)} • Kiadó: ${esc(g.publisher)}</div>
        </div>
        <button class="neon-btn" id="closeOverlay"><i class="bi bi-x-lg"></i></button>
      </div>
      <hr style="border-color:var(--line)" />
      <div class="row g-3">
        <div class="col-lg-6">
          <img src="${esc(g.thumbnail)}" class="w-100" style="border-radius:16px;object-fit:cover" alt="">
        </div>
        <div class="col-lg-6">
          <div class="small-muted mb-2">${esc(g.short_description || "")}</div>
          <a class="neon-btn w-100 text-center" href="${esc(g.game_url)}" target="_blank" rel="noreferrer">
            <i class="bi bi-box-arrow-up-right"></i> Hivatalos oldal
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector("#closeOverlay").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}

function addFav(id) {
  const fav = new Set(JSON.parse(localStorage.getItem("favs") || "[]"));
  fav.add(String(id));
  localStorage.setItem("favs", JSON.stringify([...fav]));
  updateFavCount();
}

function updateFavCount() {
  const fav = JSON.parse(localStorage.getItem("favs") || "[]");
  const el = document.getElementById("favCount");
  if (el) el.textContent = `${fav.length} db`;
}

function parseHashId() {
  const m = (location.hash || "").match(/id=(\d+)/);
  return m ? m[1] : null;
}

function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }
