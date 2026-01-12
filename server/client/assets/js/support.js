import { api } from "./api.js";

export function initSupport() {
  document.getElementById("send")?.addEventListener("click", sendSupport);
  document.getElementById("donate")?.addEventListener("click", sendDonate);
}

async function sendSupport() {
  const status = document.getElementById("status");
  status.textContent = "";

  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!email || !subject || !message) {
    status.textContent = "Hiba: Minden mező kötelező.";
    return;
  }

  try {
    const res = await api.request("/api/support", { method: "POST", body: { email, subject, message } });
    status.textContent = res.message;
    document.getElementById("message").value = "";
  } catch (e) {
    status.textContent = `Hiba: ${e.message}`;
  }
}

async function sendDonate() {
  const status = document.getElementById("dStatus");
  status.textContent = "";

  const email = document.getElementById("dEmail").value.trim();
  const amount = parseInt(document.getElementById("amount").value, 10);

  if (!amount || amount < 100) {
    status.textContent = "Hiba: Minimum 100 HUF.";
    return;
  }

  try {
    const res = await api.request("/api/donate", { method: "POST", body: { email: email || undefined, amount, currency: "HUF" } });
    status.textContent = res.message;
  } catch (e) {
    status.textContent = `Hiba: ${e.message}`;
  }
}
