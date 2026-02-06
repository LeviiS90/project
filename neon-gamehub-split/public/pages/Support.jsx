/**
 * pages/Support.jsx
 * ----------------
 * Support / Contact:
 * - POST /api/support (contact form)
 * - POST /api/donate (demo támogatás)
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

const { useState } = React;

window.NGH.pages.Support = function Support(){
  const SectionTitle = window.NGH.components.SectionTitle;
  const api = window.NGH.lib.api;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [donateName, setDonateName] = useState("");
  const [amount, setAmount] = useState("5");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [status, setStatus] = useState("");

  async function submitContact(e){
    e.preventDefault();
    setStatus("");
    try{
      const r = await api("/api/support", { method:"POST", body:{ name, email, message } });
      setStatus(r.message);
      setName(""); setEmail(""); setMessage("");
    }catch(e){ setStatus(e.message); }
  }

  async function submitDonate(e){
e.preventDefault();
setStatus("");

// --- egyszerű demo validáció ---
const amt = Number(amount);
const num = String(cardNumber || "").replace(/\s+/g,"");
const exp = String(cardExp || "").trim();
const cvc = String(cardCvc || "").trim();

function luhnOk(s){
  if(!/^[0-9]{12,19}$/.test(s)) return false;
  let sum = 0, alt = false;
  for(let i=s.length-1;i>=0;i--){
    let n = parseInt(s[i],10);
    if(alt){ n*=2; if(n>9) n-=9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

if(!amt || amt <= 0) return setStatus("Adj meg egy érvényes összeget (>= 1 €).");
if(!cardName.trim()) return setStatus("A 'Név a kártyán' mező kötelező.");
if(!luhnOk(num)) return setStatus("Érvénytelen kártyaszám (demo ellenőrzés).");
if(!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp)) return setStatus("A lejárat formátuma: MM/YY.");
if(!/^\d{3,4}$/.test(cvc)) return setStatus("A CVC 3-4 számjegy.");

    try{
      const r = await api("/api/donate", {
        method:"POST",
        body:{
          amount,
          name: donateName,
          cardName,
          cardNumber,
          cardExp,
          cardCvc
        }
      });
      setStatus(r.message);
    }catch(e){ setStatus(e.message); }
  }

  return (
    <div>
      <SectionTitle icon="bi-life-preserver" title="Support / Contact" subtitle="Űrlap + demo donate végpont"/>
      {status && <div className="alert alert-info">{status}</div>}
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="neon-card p-3 glow border-neon">
            <div className="fw-semibold neon mb-2"><i className="bi bi-envelope me-2"></i>Kapcsolat</div>
            <form onSubmit={submitContact}>
              <div className="row g-2">
                <div className="col-md-6">
                  <input className="form-control" placeholder="Név" value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <input className="form-control" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
                <div className="col-12">
                  <textarea className="form-control" rows="4" placeholder="Üzenet..." value={message} onChange={e=>setMessage(e.target.value)}></textarea>
                </div>
                <div className="col-12 d-flex justify-content-end">
                  <button className="btn btn-neon"><i className="bi bi-send me-2"></i>Küldés</button>
                </div>
              </div>
              <div className="small-muted mt-2">Visszaigazoló üzenetet kapsz (demo).</div>
            </form>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="neon-card p-3 glow2 border-neon">
            <div className="fw-semibold neon mb-2"><i className="bi bi-heart-pulse me-2"></i>Donate (opcionális)</div>
            <form onSubmit={submitDonate}>
              <input className="form-control mb-2" placeholder="Név (opcionális)" value={donateName} onChange={e=>setDonateName(e.target.value)} />

              <div className="mb-2">
                <label className="form-label small-muted mb-1">Összeg (€)</label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {["3","5","10","25"].map(v=>(
                    <button
                      key={v}
                      type="button"
                      className={"btn btn-sm " + (amount===v ? "btn-neon" : "btn-outline-light")}
                      onClick={()=>setAmount(v)}
                    >
                      {v} €
                    </button>
                  ))}
                </div>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={e=>setAmount(e.target.value)}
                  placeholder="Egyedi összeg (pl. 7)"
                />
              </div>

              <div className="border-top border-secondary pt-2 mt-2">
                <div className="fw-semibold neon mb-2"><i className="bi bi-credit-card me-2"></i>Bankkártya adatok</div>

                <input className="form-control mb-2" placeholder="Név a kártyán" value={cardName} onChange={e=>setCardName(e.target.value)} required />
                <input className="form-control mb-2" placeholder="Kártyaszám (pl. 4242 4242 4242 4242)" value={cardNumber} onChange={e=>setCardNumber(e.target.value)} inputMode="numeric" required />

                <div className="row g-2">
                  <div className="col-6">
                    <input className="form-control" placeholder="Lejárat (MM/YY)" value={cardExp} onChange={e=>setCardExp(e.target.value)} required />
                  </div>
                  <div className="col-6">
                    <input className="form-control" placeholder="CVC" value={cardCvc} onChange={e=>setCardCvc(e.target.value)} inputMode="numeric" required />
                  </div>
                </div>
              </div>

              <button className="btn btn-neon w-100 mt-3">
                <i className="bi bi-lock-fill me-2"></i>Fizetés (demo)
              </button>
            </form>
            <div className="small-muted mt-2">Demo fizetés: csak visszaad egy "köszi" választ.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
