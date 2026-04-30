import { useState, useEffect, useRef } from "react";
import BusMap from "./BusMap";

function Marquee({ text, color }) {
  return (
    <div style={{ overflow:"hidden", whiteSpace:"nowrap", width:"100%" }}>
      <span style={{ display:"inline-block", animation:"marquee 18s linear infinite",
        color, fontSize:"17px", fontWeight:"bold", letterSpacing:"3px" }}>
        {text}&nbsp;&nbsp;&nbsp;&nbsp;{text}&nbsp;&nbsp;&nbsp;&nbsp;{text}
      </span>
    </div>
  );
}

function BigTile({ icon, label, value, accent, blink }) {
  return (
    <div style={{ background:"rgba(0,0,0,0.55)", border:`2px solid ${accent}55`,
      borderRadius:"8px", padding:"24px 18px", textAlign:"center",
      boxShadow:`0 0 30px ${accent}22`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:accent }}/>
      <div style={{ fontSize:"36px", marginBottom:"8px" }}>{icon}</div>
      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"12px", letterSpacing:"4px", marginBottom:"8px" }}>{label}</div>
      <div style={{ color:accent, fontSize:"30px", fontWeight:"900", letterSpacing:"2px",
        textShadow:`0 0 20px ${accent}aa`, animation:blink?"bigBlink 1s infinite":"none" }}>{value}</div>
    </div>
  );
}

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const iv=setInterval(()=>setT(new Date()),1000); return ()=>clearInterval(iv); },[]);
  return (
    <div style={{ textAlign:"right" }}>
      <div style={{ color:"#00c8ff", fontSize:"28px", fontWeight:"bold", letterSpacing:"3px",
        textShadow:"0 0 12px #00c8ff66", fontVariantNumeric:"tabular-nums" }}>
        {t.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
      </div>
      <div style={{ color:"rgba(255,255,255,0.25)", fontSize:"11px", letterSpacing:"2px" }}>
        {t.toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric"})}
      </div>
    </div>
  );
}

export default function PublicBoard({ darkMode, onBack }) {
  const [busList,     setBusList]     = useState(["BUS001","BUS002","BUS003"]);
  const [selectedBus, setSelectedBus] = useState("BUS001");
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdate,  setLastUpdate]  = useState(null);

  useEffect(() => {
    fetch("/data/buses").then(r=>r.json()).then(l=>{ if(Array.isArray(l)&&l.length) setBusList(l); }).catch(()=>{});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res  = await fetch(`/data/view?busId=${selectedBus}`);
        const json = await res.json();
        setData(json);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch {}
      finally { setLoading(false); }
    };
    setData(null); setLoading(true);
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [selectedBus]);

  const avSeats  = data?.availableSeats ?? 0;
  const totSeats = data?.totalSeats ?? 60;
  const oilOk    = data?.oil !== "0";
  const ticket   = data?.ticket || "₹0";
  const speed    = data?.speed  || "0 km/h";
  const temp     = data?.temp   || "—";
  const tripOn   = data?.tripActive;
  const seatColor = avSeats===0?"#ff3c3c":avSeats<=5?"#f59e0b":"#00ff88";
  const lat = data?.latitude  || "0.0";
  const lng = data?.longitude || "0.0";

  const marqueeText = avSeats===0
    ? `🚫 ${selectedBus} IS FULL — Please wait for the next bus`
    : avSeats<=5
    ? `⚠️  HURRY! Only ${avSeats} seat${avSeats===1?"":"s"} left on ${selectedBus}  |  Ticket: ${ticket}  |  Pay via UPI`
    : `🚌 ${selectedBus}  |  ${avSeats}/${totSeats} SEATS FREE  |  Ticket: ${ticket}  |  Speed: ${speed}  |  Scan QR to pay`;

  return (
    <div style={{ minHeight:"100vh", background:"#020810",
      display:"flex", flexDirection:"column", fontFamily:"'Courier New',monospace" }}>
      <style>{`
        @keyframes marquee   { 0%{transform:translateX(0)} 100%{transform:translateX(-33.33%)} }
        @keyframes bigBlink  { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes radarPing { 0%{transform:scale(0.4);opacity:0.9} 100%{transform:scale(2.5);opacity:0} }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }
        @keyframes scanline  { 0%{top:-8%} 100%{top:108%} }
      `}</style>

      {/* CRT scanline */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:50,
        backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.1) 0px,rgba(0,0,0,0.1) 1px,transparent 1px,transparent 3px)" }}/>
      <div style={{ position:"fixed", left:0, right:0, height:"8%", background:"rgba(0,200,255,0.035)",
        animation:"scanline 4s linear infinite", pointerEvents:"none", zIndex:51 }}/>

      {/* grid bg */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(0,200,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.02) 1px,transparent 1px)",
        backgroundSize:"50px 50px" }}/>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 28px", background:"rgba(0,0,0,0.82)",
        borderBottom:"2px solid rgba(0,200,255,0.3)", position:"relative", zIndex:10, flexWrap:"wrap", gap:"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <span style={{ fontSize:"32px" }}>🚌</span>
          <div>
            <div style={{ color:"#00c8ff", fontSize:"18px", fontWeight:"900", letterSpacing:"4px" }}>ONLINE BUS TRACKING</div>
            <div style={{ color:"rgba(255,255,255,0.25)", fontSize:"10px", letterSpacing:"3px" }}>PASSENGER INFORMATION DISPLAY</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px",
            background:"rgba(0,255,136,0.1)", border:"1px solid rgba(0,255,136,0.3)",
            borderRadius:"2px", padding:"4px 10px" }}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#00ff88",
              boxShadow:"0 0 8px #00ff88", animation:"pulse 1.5s infinite", display:"inline-block" }}/>
            <span style={{ color:"#00ff88", fontSize:"10px", letterSpacing:"2px" }}>
              {tripOn?"TRIP ACTIVE":"LIVE"}
            </span>
          </div>
        </div>
        <Clock />
        <button onClick={onBack}
          style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.45)",
            border:"1px solid rgba(255,255,255,0.1)", borderRadius:"3px",
            padding:"7px 14px", cursor:"pointer", fontSize:"10px",
            letterSpacing:"2px", fontFamily:"'Courier New',monospace" }}>
          ← BACK
        </button>
      </header>

      {/* ── Bus Selector ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap",
        padding:"8px 28px", background:"rgba(0,0,0,0.55)",
        borderBottom:"1px solid rgba(0,200,255,0.15)", position:"relative", zIndex:10 }}>
        <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"10px", letterSpacing:"3px" }}>SELECT BUS:</span>
        {busList.map(b => (
          <button key={b} onClick={() => setSelectedBus(b)} style={{
            background:   b===selectedBus?"rgba(0,200,255,0.18)":"transparent",
            border:       `1px solid ${b===selectedBus?"#00c8ff":"rgba(255,255,255,0.1)"}`,
            color:        b===selectedBus?"#00c8ff":"rgba(255,255,255,0.35)",
            borderRadius: "3px", padding:"6px 16px", cursor:"pointer",
            fontSize:"12px", fontWeight:"bold", letterSpacing:"2px",
            fontFamily:"'Courier New',monospace", transition:"all 0.2s",
            boxShadow: b===selectedBus?"0 0 14px rgba(0,200,255,0.3)":"none",
          }}>🚌 {b}</button>
        ))}
        <span style={{ color:"rgba(0,200,255,0.5)", fontSize:"11px", marginLeft:"auto" }}>
          Viewing: <strong style={{ color:"#00c8ff" }}>{selectedBus}</strong>
        </span>
      </div>

      {/* ── Marquee ──────────────────────────────────────────────────────────── */}
      <div style={{ background:avSeats===0?"rgba(255,40,40,0.18)":avSeats<=5?"rgba(245,158,11,0.13)":"rgba(0,200,255,0.07)",
        borderBottom:`1px solid ${seatColor}44`, padding:"9px 24px" }}>
        <Marquee text={marqueeText} color={seatColor} />
      </div>

      {loading ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ color:"#00c8ff", fontSize:"14px", letterSpacing:"6px",
            animation:"bigBlink 1s infinite" }}>LOADING {selectedBus}...</div>
        </div>
      ) : (
        <main style={{ flex:1, display:"grid",
          gridTemplateColumns:"1fr 1fr 1fr",
          gridTemplateRows:"auto 1fr",
          gap:"16px", padding:"18px 24px 18px", position:"relative", zIndex:5 }}>

          {/* Row 1 — big tiles */}
          <BigTile icon="🪑" label="AVAILABLE SEATS"
            value={avSeats===0?"FULL":`${avSeats} / ${totSeats}`}
            accent={seatColor} blink={avSeats===0}/>
          <BigTile icon="🏎️" label="CURRENT SPEED"
            value={speed}
            accent={parseFloat(speed)>80?"#ff3c3c":"#f59e0b"}/>
          <BigTile icon="🎫" label="TICKET PRICE"
            value={ticket} accent="#00c8ff"/>

          {/* Row 2 — map (spans 2 cols) + right column */}
          <div style={{ gridColumn:"1 / 3", borderRadius:"8px", overflow:"hidden",
            border:"2px solid rgba(0,200,255,0.2)", minHeight:"320px", position:"relative" }}>
            <BusMap
              key={selectedBus}
              latitude={lat}
              longitude={lng}
              busId={selectedBus}
              darkMode={true}
              speed={data?.speed}
            />
          </div>

          {/* Right column */}
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            {/* QR */}
            <div style={{ background:"rgba(0,0,0,0.5)", border:"1px solid rgba(0,200,255,0.2)",
              borderRadius:"8px", padding:"16px", display:"flex", flexDirection:"column",
              alignItems:"center", gap:"10px" }}>
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", letterSpacing:"3px" }}>📱 SCAN &amp; PAY UPI</div>
              <div style={{ background:"white", padding:"10px", borderRadius:"6px",
                boxShadow:"0 0 24px rgba(0,200,255,0.2)" }}>
                <img src="/qr-payment.jpeg" alt="UPI QR"
                  style={{ width:"130px", height:"130px", display:"block", objectFit:"contain" }}
                  onError={e=>e.target.style.display="none"}/>
              </div>
              <div style={{ color:"#00c8ff", fontSize:"24px", fontWeight:"900", letterSpacing:"2px" }}>{ticket}</div>
              <div style={{ color:"rgba(255,255,255,0.2)", fontSize:"10px" }}>Google Pay · PhonePe · Paytm</div>
            </div>

            {/* Status */}
            <div style={{ background:"rgba(0,0,0,0.5)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:"8px", padding:"16px", display:"flex", flexDirection:"column", gap:"10px" }}>
              <div style={{ color:"rgba(255,255,255,0.25)", fontSize:"10px", letterSpacing:"3px" }}>BUS STATUS</div>
              {[
                { k:"ENGINE TEMP", v:temp,                         c:parseFloat(temp)>80?"#ff3c3c":"#00ff88" },
                { k:"OIL LEVEL",   v:oilOk?"NORMAL ✓":"LOW ⚠",   c:oilOk?"#00ff88":"#ff3c3c" },
                { k:"TRIP",        v:tripOn?"ACTIVE ▶":"IDLE ■",  c:tripOn?"#00ff88":"rgba(255,255,255,0.3)" },
                { k:"UPDATED",     v:lastUpdate||"—",              c:"#00c8ff" },
              ].map(row=>(
                <div key={row.k} style={{ display:"flex", justifyContent:"space-between",
                  padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"10px", letterSpacing:"2px" }}>{row.k}</span>
                  <span style={{ color:row.c, fontSize:"11px", fontWeight:"bold" }}>{row.v}</span>
                </div>
              ))}
            </div>

            {/* Oil warning */}
            {!oilOk && (
              <div style={{ background:"rgba(255,40,40,0.18)", border:"2px solid #ff3c3c",
                borderRadius:"6px", padding:"12px", textAlign:"center",
                animation:"bigBlink 0.8s infinite" }}>
                <div style={{ fontSize:"22px" }}>🛢️</div>
                <div style={{ color:"#ff3c3c", fontSize:"12px", fontWeight:"bold", letterSpacing:"2px", marginTop:"4px" }}>
                  OIL LEVEL LOW
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      <footer style={{ background:"rgba(0,0,0,0.82)", borderTop:"1px solid rgba(0,200,255,0.2)",
        padding:"8px 28px", display:"flex", justifyContent:"space-between", alignItems:"center",
        position:"relative", zIndex:10 }}>
        <span style={{ color:"rgba(255,255,255,0.15)", fontSize:"10px", letterSpacing:"2px" }}>AUTO-REFRESH EVERY 5s</span>
        <span style={{ color:"rgba(0,200,255,0.35)", fontSize:"10px", letterSpacing:"2px" }}>ONLINE BUS TRACKING SYSTEM</span>
        <span style={{ color:"rgba(255,255,255,0.15)", fontSize:"10px", letterSpacing:"2px" }}>
          {lastUpdate?`UPDATED ${lastUpdate}`:"CONNECTING..."}
        </span>
      </footer>
    </div>
  );
}
