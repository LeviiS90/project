import { api } from "./api.js";

export async function initBoard() {
  document.getElementById("refresh")?.addEventListener("click", load);
  document.getElementById("send")?.addEventListener("click", send);
  await load();
}

async function load() {
  const data = await api.request("/api/messages");
  document.getElementById("topicText").textContent = data.topic.topic;
  document.getElementById("topicDate").textContent = `Hét kezdete: ${data.topic.week_start}`;

  const list = document.getElementById("list");
  list.innerHTML = "";

  for (const m of data.messages) {
    const col = document.createElement("div");
    col.className = "col-12";
    col.innerHTML = `
      <div class="cyber-card p-3">
        <div class="d-flex justify-content-between align-items-center">
          <div class="fw-bold">${esc(m.username)}</div>
          <div class="small-muted">${esc(m.created_at)}</div>
        </div>
        <div class="mt-2">${esc(m.content)}</div>
      </div>
    `;
    list.appendChild(col);
  }
}

async function send() {
  const status = document.getElementById("status");
  status.textContent = "";

  const content = document.getElementById("content").value.trim();
  if (!content) {
    status.textContent = "Hiba: üres üzenetet nem lehet küldeni.";
    return;
  }

  try {
    await api.request("/api/messages", { method: "POST", body: { content } });
    document.getElementById("content").value = "";
    status.textContent = "Elküldve!";
    await load();
  } catch (e) {
    if (String(e.message).includes("401")) {
      status.textContent = "401 Unauthorized: Bejelentkezés szükséges az üzenetküldéshez.";
      return;
    }
    status.textContent = `Hiba: ${e.message}`;
  }
}

function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }