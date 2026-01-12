import { api } from "./api.js";
import { setAuth } from "./app.js";

export function initRegister() {
  document.getElementById("submit")?.addEventListener("click", async () => {
    const status = document.getElementById("status");
    status.textContent = "";

    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !username || !password) {
      status.textContent = "Hiba: Minden mezőt ki kell tölteni!";
      return;
    }

    try {
      await api.request("/api/auth/register", { method: "POST", body: { email, username, password } });
      status.textContent = "Sikeres regisztráció! Átirányítás loginra…";
      setTimeout(() => (location.href = "/login.html"), 900);
    } catch (e) {
      status.textContent = `Hiba: ${e.message}`;
    }
  });
}

export function initLogin() {
  document.getElementById("submit")?.addEventListener("click", async () => {
    const status = document.getElementById("status");
    status.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      status.textContent = "Hiba: Email és jelszó kötelező.";
      return;
    }

    try {
      const data = await api.request("/api/auth/login", { method: "POST", body: { email, password } });
      setAuth(data);
      status.textContent = "Sikeres belépés! Vissza a főoldalra…";
      setTimeout(() => (location.href = "/index.html"), 800);
    } catch (e) {
      status.textContent = `Hiba: ${e.message}`;
    }
  });
}
