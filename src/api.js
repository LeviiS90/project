const API_URL = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ===== AUTH ===== */
export async function register(email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error("Regisztráció sikertelen");
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error("Hibás belépés");

  const data = await res.json();
  localStorage.setItem("token", data.token);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}

/* ===== GAMES ===== */
export async function getGames() {
  const res = await fetch(`${API_URL}/games`);
  if (!res.ok) throw new Error("Games betöltés sikertelen");
  return res.json();
}

export async function getGameById(id) {
  const res = await fetch(`${API_URL}/games/${id}`);
  if (!res.ok) throw new Error("Játék részletek nem találhatók");
  return res.json();
}

/* ===== NEWS ===== */
export async function getNews() {
  const res = await fetch(`${API_URL}/news`);
  if (!res.ok) throw new Error("News betöltés sikertelen");
  return res.json();
}

export async function getNewsAggregate({ limit = 60 } = {}) {
  const res = await fetch(`${API_URL}/news/aggregate?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error("News (aggregate) betöltés sikertelen");
  return res.json();
}

/* ===== GOTY ===== */
export async function getGoty() {
  const res = await fetch(`${API_URL}/goty`);
  if (!res.ok) throw new Error("GOTY betöltés sikertelen");
  return res.json();
}

/* ===== WEEKLY TOPICS ===== */
export async function getWeeklyTopicCurrent() {
  const res = await fetch(`${API_URL}/weekly-topics/current`);
  if (!res.ok) throw new Error("Weekly topic betöltés sikertelen");
  return res.json();
}

/* ===== MESSAGES ===== */
export async function getMessages() {
  const res = await fetch(`${API_URL}/messages`);
  if (!res.ok) throw new Error("Messages betöltés sikertelen");
  return res.json();
}

export async function postMessage(text, topic) {
  const res = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text, topic })
  });

  if (res.status === 401) throw new Error("401 Unauthorized");
  if (!res.ok) throw new Error("Üzenet küldés sikertelen");
  return res.json();
}

export async function deleteMessageByIndex(index) {
  const res = await fetch(`${API_URL}/messages/${index}`, {
    method: "DELETE",
    headers: { ...authHeaders() }
  });

  if (res.status === 401) throw new Error("401 Unauthorized");
  if (res.status === 403) throw new Error("403 Forbidden (admin only)");
  if (!res.ok) throw new Error("Törlés sikertelen");
  return res.json();
}

/* ===== SUPPORT + DONATE ===== */
export async function sendSupport({ name, email, message }) {
  const res = await fetch(`${API_URL}/support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message })
  });
  if (!res.ok) throw new Error("Support küldés sikertelen");
  return res.json();
}

export async function donate({ name, amount }) {
  const res = await fetch(`${API_URL}/donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, amount })
  });
  if (!res.ok) throw new Error("Donate sikertelen");
  return res.json();
}
