import { api } from "./api.js";

export async function initGoty() {
  const data = await api.request("/api/goty");
  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  data.forEach((g) => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-xl-4";

    const img = g.image_url
      ? `<img src="${esc(g.image_url)}" class="w-100 mb-2" style="height:160px;object-fit:cover;border-radius:14px" alt="">`
      : "";

    col.innerHTML = `
      <a class="text-decoration-none" href="${esc(g.official_url)}" target="_blank" rel="noreferrer">
        <div class="cyber-card h-100 p-3" style="cursor:pointer">
          ${img}
          <div class="d-flex justify-content-between align-items-center">
            <span class="neon-pill">${g.year}</span>
            <i class="bi bi-stars" style="color:var(--neonA)"></i>
          </div>
          <div class="fw-bold mt-2">${esc(g.title)}</div>
          <div class="small-muted mt-2">${esc(g.description)}</div>
          <div class="small-muted mt-3"><i class="bi bi-box-arrow-up-right me-2"></i>Official</div>
        </div>
      </a>
    `;
    cards.appendChild(col);
  });
}

function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }
