export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function setAuth({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function wireNavbar() {
  const user = getUser();
  const elUser = document.querySelector("[data-user]");
  const elLogout = document.querySelector("[data-logout]");

  if (elUser) elUser.textContent = user ? `${user.username} (${user.role})` : "Guest";
  if (elLogout) {
    elLogout.style.display = user ? "inline-flex" : "none";
    elLogout.addEventListener("click", () => {
      clearAuth();
      location.href = "/index.html";
    });
  }
}
