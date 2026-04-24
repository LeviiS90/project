/**
 * lib/api.js
 * ----------
 * Közös helper függvények (fetch wrapper, dátum formázás).
 * Mivel nincs bundler/import, mindent a window.NGH namespace alá teszünk.
 */
window.NGH = window.NGH || {};
window.NGH.lib = window.NGH.lib || {};

/** JSON fetch + hibakezelés (HTTP status alapján dob Error-t). */
window.NGH.lib.api = async function api(path, { method="GET", body=null, token=null } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

window.NGH.lib.formatDate = function formatDate(d) {
  try {
    let v = d;
    // MySQL DATETIME gyakran "YYYY-MM-DD HH:MM:SS" formában jön,
    // amit a böngésző nem mindig tud megbízhatóan parse-olni.
    // Konvertáljuk ISO-szerű formára: "YYYY-MM-DDTHH:MM:SS".
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(v)) {
      v = v.replace(" ", "T");
    }
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString("hu-HU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d || "";
  }
};
