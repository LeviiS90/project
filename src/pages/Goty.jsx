import { useEffect, useState } from "react";
import { getGoty } from "../api.js";

export default function Goty() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const g = await getGoty();
        setItems(g); // backend már 10-et ad
      } catch {}
    })();
  }, []);

  return (
    <div>
      <h2 className="section-title">🏆 GOTY — Elmúlt 10 év</h2>
      <p className="section-sub">Pontosan 10 kártya • kattints a hivatalos oldalra</p>

      <div className="timeline">
        {items.map((x) => (
          <div className="timeline-item" key={x.year}>
            <div className="timeline-year">{x.year}</div>
            <a className="card hover p-3" href={x.url} target="_blank" rel="noreferrer">
              <div className="fw-bold">{x.game}</div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>Kattints a hivatalos oldalra →</div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
