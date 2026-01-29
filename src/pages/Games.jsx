import { useEffect, useMemo, useState } from "react";
import { getGames, getGameById } from "../api.js";
import { useToast } from "../components/ToastProvider.jsx";

export default function Games() {
  const toast = useToast();
  const [all, setAll] = useState([]);
  // Multi-szűrők: több műfaj / több platform egyszerre
  const [genresSel, setGenresSel] = useState([]); // [] = mind
  const [platformsSel, setPlatformsSel] = useState([]); // [] = mind
  const [q, setQ] = useState("");

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const g = await getGames();
        setAll(g);
      } catch {
        setErr("Games betöltés sikertelen");
      }
    })();
  }, []);

  const genres = useMemo(() => {
    const s = new Set(all.map(x => x.genre).filter(Boolean));
    return Array.from(s).sort();
  }, [all]);

  // A FreeToGame API főleg PC/Web platformokat ad, de a UI készen áll console kategóriára is.
  const platforms = useMemo(() => {
    const s = new Set(all.map(x => x.platform).filter(Boolean));
    const list = Array.from(s).sort();

    // "Console" virtuális opció: minden, ami nem PC/Web.
    // (Ha a datasetben később megjelenik PS/Xbox/Switch stb, automatikusan működik.)
    const hasNonPcWeb = list.some(p => p !== "PC (Windows)" && p !== "Web Browser");
    return hasNonPcWeb ? [...list, "Console"] : list;
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter(x => {
      const okG = genresSel.length === 0 || genresSel.includes(x.genre);

      const platformMatches = (p) => {
        if (p === "Console") return x.platform !== "PC (Windows)" && x.platform !== "Web Browser";
        return x.platform === p;
      };
      const okP = platformsSel.length === 0 || platformsSel.some(platformMatches);

      const okQ = !q.trim() || (x.title || "").toLowerCase().includes(q.toLowerCase());
      return okG && okP && okQ;
    });
  }, [all, genresSel, platformsSel, q]);

  async function openDetails(id) {
    setSelected(id);
    setDetail(null);
    try {
      const d = await getGameById(id);
      setDetail(d);
      // Bootstrap modal open
      const el = document.getElementById("gameModal");
      if (el) window.bootstrap?.Modal.getOrCreateInstance(el).show();
    } catch {
      setDetail({ error: "Nem sikerült betölteni a részleteket." });
    }
  }

  function toggleFav(game) {
    const key = "favs";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    const exists = current.find(x => x.id === game.id);
    const next = exists ? current.filter(x => x.id !== game.id) : [...current, { id: game.id, title: game.title }];
    localStorage.setItem(key, JSON.stringify(next));
    toast.push(exists ? "❌ Kivetted a kedvencekből" : "✅ Kedvencekhez adva", {
      type: exists ? "warn" : "success",
      ttl: 2200,
    });
  }

  return (
    <>
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">🎮 Játékok böngészése</h2>
          <p className="section-sub">Szűrők bal oldalt • kártyák jobb oldalt • részletek modalban</p>
        </div>
        <span className="badge-neon">Találatok: {filtered.length}</span>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="row g-3">
        {/* Filters */}
        <div className="col-12 col-lg-3">
          <div className="card soft p-3">
            <div className="fw-bold mb-2">Szűrők</div>

            <label className="form-label mt-2">Keresés</label>
            <input className="form-control" placeholder="pl. Warframe…" value={q} onChange={(e)=>setQ(e.target.value)} />

            <label className="form-label mt-3">Műfaj</label>
            <div className="ngh-filter-list">
              {genres.map((g) => {
                const checked = genresSel.includes(g);
                return (
                  <label key={g} className="ngh-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setGenresSel((xs) =>
                          checked ? xs.filter((x) => x !== g) : [...xs, g]
                        );
                      }}
                    />
                    <span>{g}</span>
                  </label>
                );
              })}
            </div>

            <label className="form-label mt-3">Platform</label>
            <div className="ngh-filter-list">
              {platforms.map((p) => {
                const checked = platformsSel.includes(p);
                return (
                  <label key={p} className="ngh-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setPlatformsSel((xs) =>
                          checked ? xs.filter((x) => x !== p) : [...xs, p]
                        );
                      }}
                    />
                    <span>{p}</span>
                  </label>
                );
              })}
            </div>

            <button
              className="btn neon-btn-outline mt-3"
              onClick={() => {
                setGenresSel([]);
                setPlatformsSel([]);
                setQ("");
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="col-12 col-lg-9">
          <div className="row g-3">
            {filtered.slice(0, 30).map(g => (
              <div className="col-12 col-sm-6 col-xl-4" key={g.id}>
                <div className="card hover p-2 h-100">
                  <img src={g.thumbnail} alt={g.title} style={{ width:"100%", borderRadius: 14 }} />
                  <div className="mt-2 fw-bold">{g.title}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>{g.genre} • {g.platform}</div>
                  <div style={{ opacity: 0.85, fontSize: 13 }} className="mt-2">
                    {g.short_description?.slice(0, 110)}{g.short_description?.length > 110 ? "…" : ""}
                  </div>

                  <div className="d-flex gap-2 flex-wrap mt-3">
                    <button className="btn neon-btn btn-sm" onClick={() => openDetails(g.id)}>Részletek</button>
                    <button className="btn neon-btn-outline btn-sm" onClick={() => toggleFav(g)}>★ Kedvencek</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-sub mt-3">
            (A FreeToGame API sok adatot ad — itt 30-at listázunk, de a filter a teljes listán fut.)
          </div>
        </div>
      </div>

      {/* Modal */}
      <div className="modal fade" id="gameModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content" style={{ background: "rgba(10,3,25,0.92)", border: "1px solid rgba(0,255,255,0.18)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid rgba(0,255,255,0.12)" }}>
              <h5 className="modal-title">🎮 Game details</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              {!detail && <div style={{ opacity: 0.85 }}>Betöltés...</div>}
              {detail?.error && <div className="alert alert-danger">{detail.error}</div>}

              {detail && !detail.error && (
                <div className="row g-3">
                  <div className="col-12 col-md-5">
                    <img src={detail.thumbnail} alt="" style={{ width:"100%", borderRadius: 14 }} />
                  </div>
                  <div className="col-12 col-md-7">
                    <div className="fw-bold" style={{ fontSize: 18 }}>{detail.title}</div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>
                      {detail.genre} • {detail.platform} • {detail.publisher}
                    </div>
                    <p className="mt-2" style={{ opacity: 0.9 }}>
                      {detail.description?.slice(0, 600)}{detail.description?.length > 600 ? "…" : ""}
                    </p>

                    <div className="d-flex gap-2 flex-wrap">
                      {detail.game_url && (
                        <a className="btn neon-btn" href={detail.game_url} target="_blank" rel="noreferrer">
                          Hivatalos oldal
                        </a>
                      )}
                      <button className="btn neon-btn-outline" data-bs-dismiss="modal">Bezárás</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: "1px solid rgba(0,255,255,0.12)" }}>
              <div style={{ opacity: 0.75, fontSize: 12 }}>API: /api/games/:id • Selected: {selected ?? "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
