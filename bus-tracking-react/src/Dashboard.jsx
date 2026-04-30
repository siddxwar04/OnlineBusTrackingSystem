import { useState, useEffect, useRef, useCallback } from "react";
import BusMap from "./BusMap";
import qrImage from "./qr-payment.jpeg";

// ─── Sound ────────────────────────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const t = ctx.currentTime;
    if (type === "oil") {
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.5);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t); osc.stop(t + 0.5);
    } else if (type === "seats") {
      osc.frequency.setValueAtTime(660, t);
      gain.gain.setValueAtTime(0.25, t); gain.gain.setValueAtTime(0, t+0.12);
      gain.gain.setValueAtTime(0.25, t+0.18); gain.gain.exponentialRampToValueAtTime(0.001, t+0.35);
      osc.start(t); osc.stop(t + 0.35);
    } else if (type === "start") {
      [440,550,660].forEach((f,i) => osc.frequency.setValueAtTime(f, t+i*0.1));
      gain.gain.setValueAtTime(0.3, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.45);
      osc.start(t); osc.stop(t+0.45);
    } else if (type === "stop") {
      [660,550,440].forEach((f,i) => osc.frequency.setValueAtTime(f, t+i*0.1));
      gain.gain.setValueAtTime(0.3, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.45);
      osc.start(t); osc.stop(t+0.45);
    }
  } catch(e) {}
}

// ─── Speedometer ──────────────────────────────────────────────────────────────
function Speedometer({ speedStr, darkMode }) {
  const max   = 120;
  const value = Math.min(parseFloat(speedStr) || 0, max);
  const pct   = value / max;
  const cx = 80, cy = 80, r = 60;
  const startA = 160 * Math.PI / 180;
  const endA   = startA + 220 * pct * Math.PI / 180;
  const fullA  = startA + 220 * Math.PI / 180;
  const arc = (from, to) => {
    const x1=cx+r*Math.cos(from), y1=cy+r*Math.sin(from);
    const x2=cx+r*Math.cos(to),   y2=cy+r*Math.sin(to);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${(to-from)>Math.PI?1:0} 1 ${x2} ${y2}`;
  };
  const color = value < 40 ? "#00ff88" : value < 80 ? "#f59e0b" : "#ff3c3c";
  const dim   = darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)";
  return (
    <svg width="160" height="130" viewBox="0 0 160 130">
      <path d={arc(startA, fullA)} fill="none" stroke={darkMode?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"} strokeWidth="10" strokeLinecap="round"/>
      <path d={arc(startA, endA > startA ? endA : startA+0.01)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 6px ${color})`, transition:"all 0.6s ease" }}/>
      {[0,30,60,90,120].map(v => {
        const a=(160+220*(v/max))*Math.PI/180;
        return (
          <g key={v}>
            <line x1={cx+(r-14)*Math.cos(a)} y1={cy+(r-14)*Math.sin(a)}
                  x2={cx+(r-6)*Math.cos(a)}  y2={cy+(r-6)*Math.sin(a)}
                  stroke={dim} strokeWidth="1.5"/>
            <text x={cx+(r-26)*Math.cos(a)} y={cy+(r-26)*Math.sin(a)}
              textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={dim}>{v}</text>
          </g>
        );
      })}
      <text x={cx} y={cy+4} textAnchor="middle" fontSize="22" fontWeight="bold"
        fill={color} style={{ filter:`drop-shadow(0 0 8px ${color})`, transition:"all 0.6s" }}>
        {Math.round(value)}
      </text>
      <text x={cx} y={cy+22} textAnchor="middle" fontSize="9" fill={dim}>km/h</text>
    </svg>
  );
}

// ─── Seat Map ─────────────────────────────────────────────────────────────────
function SeatMap({ available, total, darkMode }) {
  const occupied = total - Math.max(0, Math.min(available, total));
  const seats    = Array.from({ length: total }, (_, i) => i >= total - occupied ? "taken" : "free");
  const rows     = [];
  for (let i = 0; i < total; i += 4) rows.push(seats.slice(i, i+4));
  const dim = darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)";
  return (
    <div style={{ overflowY:"auto", maxHeight:"260px" }}>
      <div style={{ textAlign:"center", fontSize:"18px", marginBottom:"8px" }}>
        🚌 <span style={{ fontSize:"10px", color:dim, letterSpacing:"2px" }}>FRONT</span>
      </div>
      {rows.map((row,ri) => (
        <div key={ri} style={{ display:"flex", justifyContent:"center", gap:"4px", marginBottom:"4px", alignItems:"center" }}>
          <span style={{ width:"18px", fontSize:"9px", color:dim, textAlign:"right", flexShrink:0 }}>{ri*4+1}</span>
          {row.slice(0,2).map((s,si) => (
            <div key={si} style={{ width:"22px", height:"18px", borderRadius:"3px",
              background: s==="free"?"#00ff8822":"#ff3c3c22",
              border: `1px solid ${s==="free"?"#00ff8866":"#ff3c3c66"}`,
              transition:"all 0.4s" }} title={s==="free"?"Free":"Occupied"} />
          ))}
          <div style={{ width:"12px" }} />
          {row.slice(2,4).map((s,si) => (
            <div key={si} style={{ width:"22px", height:"18px", borderRadius:"3px",
              background: s==="free"?"#00ff8822":"#ff3c3c22",
              border: `1px solid ${s==="free"?"#00ff8866":"#ff3c3c66"}`,
              transition:"all 0.4s" }} title={s==="free"?"Free":"Occupied"} />
          ))}
        </div>
      ))}
      <div style={{ display:"flex", gap:"12px", justifyContent:"center", marginTop:"10px" }}>
        <span style={{ fontSize:"10px", color:"#00ff88", letterSpacing:"1px" }}>🟩 Free: {available}</span>
        <span style={{ fontSize:"10px", color:"#ff3c3c", letterSpacing:"1px" }}>🟥 Taken: {occupied}</span>
      </div>
    </div>
  );
}

// ─── Alert Toast ──────────────────────────────────────────────────────────────
function AlertToast({ alerts, onDismiss }) {
  return (
    <div style={{ position:"fixed", top:"72px", right:"16px", zIndex:2000,
      display:"flex", flexDirection:"column", gap:"8px", maxWidth:"320px" }}>
      {alerts.map(a => (
        <div key={a.id} style={{
          background: a.type==="danger"?"rgba(255,40,40,0.96)":a.type==="warning"?"rgba(245,158,11,0.96)":"rgba(0,180,100,0.96)",
          borderRadius:"6px", padding:"12px 16px", color:"white",
          boxShadow:"0 4px 24px rgba(0,0,0,0.5)", display:"flex", alignItems:"center", gap:"10px",
          animation:"slideIn 0.3s ease", fontSize:"13px",
          fontFamily:"'Courier New',monospace", letterSpacing:"1px",
        }}>
          <span style={{ fontSize:"18px" }}>{a.icon}</span>
          <span style={{ flex:1 }}>{a.message}</span>
          <button onClick={() => onDismiss(a.id)}
            style={{ background:"none", border:"none", color:"white", cursor:"pointer", fontSize:"18px", padding:0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent, glow, valueColor, small, darkMode }) {
  const bg  = darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
  const lbl = darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)";
  return (
    <div style={{ background:bg, border:`1px solid ${accent}30`, borderRadius:"6px", padding:"16px",
      position:"relative", overflow:"hidden", boxShadow:`0 0 18px ${glow}`, transition:"all 0.3s" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:accent, transition:"background 0.3s" }} />
      <div style={{ fontSize:"18px", marginBottom:"6px" }}>{icon}</div>
      <div style={{ color:lbl, fontSize:"10px", letterSpacing:"2px", marginBottom:"6px" }}>{label}</div>
      <div style={{ color:valueColor||accent, fontSize:small?"13px":"19px", fontWeight:"bold",
        letterSpacing:"1px", wordBreak:"break-all", transition:"color 0.4s" }}>{value}</div>
    </div>
  );
}

// ─── Bus Selector Tabs ────────────────────────────────────────────────────────
function BusTabs({ buses, selected, onChange, darkMode }) {
  const statusColors = { active:"#00ff88", idle:"rgba(255,255,255,0.3)" };
  const bg  = darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
  const brd = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  return (
    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", padding:"10px 24px",
      background:bg, borderBottom:`1px solid ${brd}`, position:"relative", zIndex:15 }}>
      <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"10px", letterSpacing:"2px",
        alignSelf:"center", marginRight:"4px" }}>SELECT BUS:</span>
      {buses.map(b => {
        const isSelected = b === selected;
        return (
          <button key={b} onClick={() => onChange(b)} style={{
            background:   isSelected ? "rgba(0,200,255,0.15)" : "transparent",
            border:       `1px solid ${isSelected ? "#00c8ff" : "rgba(255,255,255,0.12)"}`,
            color:        isSelected ? "#00c8ff" : "rgba(255,255,255,0.4)",
            borderRadius: "3px", padding:"6px 14px", cursor:"pointer",
            fontSize:"11px", fontWeight:"bold", letterSpacing:"2px",
            fontFamily:"'Courier New',monospace", transition:"all 0.2s",
            boxShadow: isSelected ? "0 0 12px rgba(0,200,255,0.25)" : "none",
          }}>
            🚌 {b}
          </button>
        );
      })}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ user, onLogout, darkMode, setDarkMode, onPublicBoard }) {
  const [busList,     setBusList]     = useState(["BUS001","BUS002","BUS003"]);
  const [selectedBus, setSelectedBus] = useState("BUS001");
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const [alerts,      setAlerts]      = useState([]);
  const [tripActive,  setTripActive]  = useState(false);
  const [tripStart,   setTripStart]   = useState(null);
  const [tripDuration,setTripDuration]= useState("00:00:00");
  const [logCount,    setLogCount]    = useState(0);
  const [exporting,   setExporting]   = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(false);

  const alertedOil   = useRef({});
  const alertedSeats = useRef({});
  const alertedTemp  = useRef({});
  const timerRef     = useRef(null);
  const busRef       = useRef(selectedBus);
  busRef.current     = selectedBus;

  const dismissAlert = useCallback(id =>
    setAlerts(prev => prev.filter(a => a.id !== id)), []);

  const pushAlert = useCallback((type, icon, message) => {
    const id = Date.now() + Math.random();
    setAlerts(prev => [...prev.slice(-4), { id, type, icon, message }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 6000);
    playSound(type === "danger" ? "oil" : "seats");
  }, []);

  // ── Trip timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tripActive && tripStart) {
      timerRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(tripStart).getTime()) / 1000);
        const h = String(Math.floor(diff/3600)).padStart(2,"0");
        const m = String(Math.floor((diff%3600)/60)).padStart(2,"0");
        const s = String(diff%60).padStart(2,"0");
        setTripDuration(`${h}:${m}:${s}`);
      }, 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [tripActive, tripStart]);

  // ── Fetch bus list ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/data/buses")
      .then(r => r.json())
      .then(list => { if (Array.isArray(list) && list.length) setBusList(list); })
      .catch(() => {});
  }, []);

  // ── Reset alert guards when switching bus ───────────────────────────────────
  useEffect(() => {
    setData(null); setLoading(true);
    setTripActive(false); setTripStart(null); setTripDuration("00:00:00"); setLogCount(0);
  }, [selectedBus]);

  // ── Fetch live data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const bus = busRef.current;
    try {
      const res  = await fetch(`/data/view?busId=${bus}`);
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
      if (json.logCount   !== undefined) setLogCount(json.logCount);
      if (json.tripActive !== undefined) {
        setTripActive(json.tripActive);
        if (json.tripStartTime && !tripStart) setTripStart(json.tripStartTime);
      }
      // Alerts
      if (json.oil === "0" && !alertedOil.current[bus]) {
        alertedOil.current[bus] = true;
        pushAlert("danger","🛢️",`${bus}: OIL LEVEL LOW — Attention required!`);
      }
      if (json.oil === "1") alertedOil.current[bus] = false;

      const avail = json.availableSeats ?? 0;
      if (avail <= 5 && avail > 0 && !alertedSeats.current[bus]) {
        alertedSeats.current[bus] = true;
        pushAlert("warning","🪑",`${bus}: Only ${avail} seat${avail===1?"":"s"} left!`);
      }
      if (avail === 0 && !alertedSeats.current[bus]) {
        alertedSeats.current[bus] = true;
        pushAlert("danger","🚫",`${bus}: BUS IS FULL`);
      }
      if (avail > 5) alertedSeats.current[bus] = false;

      const tmpVal = parseFloat(json.temp);
      if (tmpVal > 80 && !alertedTemp.current[bus]) {
        alertedTemp.current[bus] = true;
        pushAlert("danger","🌡️",`${bus}: Engine temp critical: ${json.temp}`);
      }
      if (tmpVal <= 80) alertedTemp.current[bus] = false;
    } catch {}
    finally { setLoading(false); }
  }, [pushAlert, tripStart]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData, selectedBus]);

  // ── Trip controls ───────────────────────────────────────────────────────────
  const handleTripStart = async () => {
    await fetch(`/data/trip/start?busId=${selectedBus}`, { method:"POST" });
    setTripActive(true); setTripStart(new Date().toISOString());
    setTripDuration("00:00:00"); setLogCount(0);
    playSound("start");
    pushAlert("success","🚀",`${selectedBus}: Trip started!`);
  };

  const handleTripStop = async () => {
    await fetch(`/data/trip/stop?busId=${selectedBus}`, { method:"POST" });
    setTripActive(false); playSound("stop");
    pushAlert("success","🏁",`${selectedBus}: Trip stopped — ${logCount} points logged.`);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res  = await fetch(`/data/export?busId=${selectedBus}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${selectedBus}-trip-report.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { pushAlert("danger","❌","Export failed."); }
    finally { setExporting(false); }
  };

  const handlePrintPdf = () => {
    if (!data) return;
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>${selectedBus} Report</title>
    <style>body{font-family:monospace;padding:30px;background:#0a0a1a;color:#00c8ff}
    h1{border-bottom:2px solid #00c8ff;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th,td{padding:10px;border:1px solid #00c8ff33;text-align:left}
    th{background:#00c8ff22}
    @media print{body{background:white;color:black}th{background:#eee}th,td{border:1px solid #ccc}}</style>
    </head><body>
    <h1>🚌 ${selectedBus} — Trip Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Data Points: ${logCount}</p>
    <h2>Current Status</h2>
    <table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
    <tr><td>Temperature</td><td>${data.temp||"—"}</td></tr>
    <tr><td>Oil Level</td><td>${data.oil==="1"?"✅ NORMAL":"⚠️ LOW"}</td></tr>
    <tr><td>Speed</td><td>${data.speed||"—"}</td></tr>
    <tr><td>Seats Available</td><td>${data.availableSeats??0} / ${data.totalSeats??60}</td></tr>
    <tr><td>Ticket</td><td>${data.ticket||"—"}</td></tr>
    <tr><td>Latitude</td><td>${data.latitude||"—"}</td></tr>
    <tr><td>Longitude</td><td>${data.longitude||"—"}</td></tr>
    </tbody></table>
    <br/><button onclick="window.print()">🖨️ Print / Save PDF</button>
    </body></html>`);
    w.document.close();
  };

  // ── Theme ────────────────────────────────────────────────────────────────────
  const bg    = darkMode ? "linear-gradient(135deg,#060612 0%,#0a1020 60%,#060e1c 100%)" : "linear-gradient(135deg,#f0f4ff 0%,#e8f0fe 60%,#ddeeff 100%)";
  const hdrBg = darkMode ? "rgba(0,0,0,0.65)"     : "rgba(255,255,255,0.88)";
  const hdrBd = darkMode ? "rgba(0,200,255,0.15)" : "rgba(0,100,200,0.2)";
  const ttlC  = darkMode ? "#00c8ff" : "#0050ff";
  const subC  = darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.4)";
  const isAdmin = user?.role === "admin";

  const oilOk    = data?.oil === "1";
  const ticket   = data?.ticket || "₹0";
  const avSeats  = data?.availableSeats ?? 0;
  const totSeats = data?.totalSeats ?? 60;
  const speedStr = (data?.speed || "0 km/h").replace(" km/h","");
  const lat      = data?.latitude  || "0.0";
  const lng      = data?.longitude || "0.0";

  return (
    <div style={{ minHeight:"100vh", background:bg, display:"flex", flexDirection:"column",
      position:"relative", overflow:"hidden", fontFamily:"'Courier New',monospace" }}>

      <style>{`
        @keyframes slideIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 10px #00c8ff44} 50%{box-shadow:0 0 28px #00c8ffbb} }
        @keyframes radarPing{ 0%{transform:scale(0.4);opacity:0.9} 100%{transform:scale(2.5);opacity:0} }
      `}</style>

      {/* grid bg */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        backgroundImage:`linear-gradient(${darkMode?"rgba(0,200,255,0.025)":"rgba(0,100,200,0.035)"} 1px,transparent 1px),linear-gradient(90deg,${darkMode?"rgba(0,200,255,0.025)":"rgba(0,100,200,0.035)"} 1px,transparent 1px)`,
        backgroundSize:"40px 40px" }} />

      <AlertToast alerts={alerts} onDismiss={dismissAlert} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 20px", background:hdrBg, borderBottom:`1px solid ${hdrBd}`,
        backdropFilter:"blur(20px)", position:"relative", zIndex:20, flexWrap:"wrap", gap:"8px" }}>

        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
          <span style={{ fontSize:"22px" }}>🚌</span>
          <span style={{ color:ttlC, fontSize:"13px", fontWeight:"bold", letterSpacing:"3px" }}>BUS TRACKER</span>
          <div style={{ display:"flex", alignItems:"center", gap:"5px",
            background:"rgba(0,255,136,0.1)", border:"1px solid rgba(0,255,136,0.3)",
            borderRadius:"2px", padding:"3px 8px" }}>
            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#00ff88",
              boxShadow:"0 0 6px #00ff88", animation:"pulse 1.5s infinite", display:"inline-block" }} />
            <span style={{ color:"#00ff88", fontSize:"10px", letterSpacing:"2px" }}>LIVE</span>
          </div>
          <span style={{ background: isAdmin?"rgba(0,200,255,0.12)":"rgba(168,85,247,0.12)",
            border:`1px solid ${isAdmin?"rgba(0,200,255,0.35)":"rgba(168,85,247,0.35)"}`,
            color: isAdmin?"#00c8ff":"#a855f7", fontSize:"10px", padding:"2px 8px",
            borderRadius:"2px", letterSpacing:"2px" }}>
            {isAdmin?"👑 ADMIN":"🚌 DRIVER"}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
          {lastUpdate && <span style={{ color:subC, fontSize:"10px" }}>{lastUpdate}</span>}
          <button onClick={() => setDarkMode(d=>!d)}
            style={{ background:"none", border:`1px solid ${ttlC}44`, borderRadius:"3px",
              padding:"5px 9px", cursor:"pointer", fontSize:"14px" }}>
            {darkMode?"☀️":"🌙"}
          </button>
          <button onClick={onPublicBoard}
            style={{ background:"rgba(168,85,247,0.12)", color:"#a855f7",
              border:"1px solid rgba(168,85,247,0.3)", borderRadius:"3px",
              padding:"5px 10px", cursor:"pointer", fontSize:"10px",
              letterSpacing:"2px", fontFamily:"'Courier New',monospace" }}>
            📺 PUBLIC
          </button>
          {!tripActive ? (
            <button onClick={handleTripStart}
              style={{ background:"rgba(0,255,136,0.12)", color:"#00ff88",
                border:"1px solid rgba(0,255,136,0.3)", borderRadius:"3px",
                padding:"5px 10px", cursor:"pointer", fontSize:"10px",
                letterSpacing:"2px", fontFamily:"'Courier New',monospace" }}>
              ▶ START
            </button>
          ) : (
            <button onClick={handleTripStop}
              style={{ background:"rgba(255,60,60,0.12)", color:"#ff6b6b",
                border:"1px solid rgba(255,60,60,0.3)", borderRadius:"3px",
                padding:"5px 10px", cursor:"pointer", fontSize:"10px",
                letterSpacing:"2px", fontFamily:"'Courier New',monospace",
                animation:"glow 1.5s infinite" }}>
              ⏹ STOP
            </button>
          )}
          {isAdmin && <>
            <button onClick={handleExportCsv} disabled={exporting}
              style={{ background:"rgba(0,200,255,0.08)", color:"#00c8ff",
                border:"1px solid rgba(0,200,255,0.25)", borderRadius:"3px",
                padding:"5px 9px", cursor:"pointer", fontSize:"10px",
                letterSpacing:"1px", fontFamily:"'Courier New',monospace" }}>
              {exporting?"...":"⬇CSV"}
            </button>
            <button onClick={handlePrintPdf}
              style={{ background:"rgba(245,158,11,0.08)", color:"#f59e0b",
                border:"1px solid rgba(245,158,11,0.25)", borderRadius:"3px",
                padding:"5px 9px", cursor:"pointer", fontSize:"10px",
                letterSpacing:"1px", fontFamily:"'Courier New',monospace" }}>
              🖨PDF
            </button>
          </>}
          <button onClick={onLogout}
            style={{ background:"rgba(255,60,60,0.1)", color:"#ff6b6b",
              border:"1px solid rgba(255,60,60,0.25)", borderRadius:"3px",
              padding:"5px 10px", cursor:"pointer", fontSize:"10px",
              letterSpacing:"2px", fontFamily:"'Courier New',monospace" }}>
            LOGOUT
          </button>
        </div>
      </header>

      {/* ── Bus Selector ─────────────────────────────────────────────────────── */}
      <BusTabs buses={busList} selected={selectedBus}
        onChange={b => { setSelectedBus(b); }} darkMode={darkMode} />

      {/* ── Trip Banner ──────────────────────────────────────────────────────── */}
      {tripActive && (
        <div style={{ background:"rgba(0,255,136,0.07)", borderBottom:"1px solid rgba(0,255,136,0.2)",
          padding:"5px 20px", display:"flex", gap:"20px", alignItems:"center",
          fontSize:"11px", letterSpacing:"1px", position:"relative", zIndex:14 }}>
          <span style={{ color:"#00ff88", animation:"blink 1s infinite" }}>● TRIP ACTIVE — {selectedBus}</span>
          <span style={{ color:subC }}>Duration: <strong style={{ color:"#00ff88" }}>{tripDuration}</strong></span>
          <span style={{ color:subC }}>Points: <strong style={{ color:"#00c8ff" }}>{logCount}</strong></span>
        </div>
      )}

      {loading ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ color:"#00c8ff", fontSize:"13px", letterSpacing:"4px", animation:"blink 1s infinite" }}>
            ACQUIRING DATA — {selectedBus}...
          </div>
        </div>
      ) : (
        <main style={{ flex:1, display:"flex", flexDirection:"column", gap:"14px",
          padding:"14px 20px 80px", position:"relative", zIndex:5 }}>

          {/* Stat Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:"10px" }}>
            <StatCard icon="🌡️" label="TEMPERATURE" value={data?.temp||"— °C"}
              accent="#ff6b35" glow="rgba(255,107,53,0.12)"
              valueColor={parseFloat(data?.temp)>80?"#ff3c3c":undefined} darkMode={darkMode}/>
            <StatCard icon="🛢️" label="OIL LEVEL"
              value={oilOk?"NORMAL ✓":"LOW ⚠"}
              accent={oilOk?"#00ff88":"#ff3c3c"} glow={oilOk?"rgba(0,255,136,0.08)":"rgba(255,60,60,0.18)"}
              valueColor={oilOk?"#00ff88":"#ff3c3c"} darkMode={darkMode}/>
            <StatCard icon="🪑" label="SEATS"
              value={`${avSeats} / ${totSeats}`}
              accent={avSeats===0?"#ff3c3c":avSeats<=5?"#f59e0b":"#00c8ff"}
              glow="rgba(0,200,255,0.08)" darkMode={darkMode}/>
            <StatCard icon="🎫" label="TICKET" value={ticket}
              accent="#f59e0b" glow="rgba(245,158,11,0.08)" darkMode={darkMode}/>
            <StatCard icon="📍" label="GPS"
              value={`${lat} / ${lng}`}
              accent="#a855f7" glow="rgba(168,85,247,0.08)" small darkMode={darkMode}/>
          </div>

          {/* Speedometer + Seat Map */}
          <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:"14px" }}>
            <div style={{ background:darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.04)",
              border:"1px solid rgba(255,107,53,0.2)", borderRadius:"6px", padding:"14px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
              <div style={{ color:subC, fontSize:"10px", letterSpacing:"2px" }}>🏎️ SPEED</div>
              <Speedometer speedStr={speedStr} darkMode={darkMode}/>
              <div style={{ color:subC, fontSize:"11px" }}>
                <strong style={{ color:"#ff6b35" }}>{data?.speed||"0 km/h"}</strong>
              </div>
            </div>
            <div style={{ background:darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.03)",
              border:"1px solid rgba(0,200,255,0.14)", borderRadius:"6px", padding:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <div style={{ color:subC, fontSize:"10px", letterSpacing:"2px" }}>🪑 SEAT MAP</div>
                <button onClick={() => setShowSeatMap(v=>!v)}
                  style={{ background:"none", border:`1px solid ${ttlC}44`, borderRadius:"3px",
                    color:ttlC, padding:"3px 8px", cursor:"pointer", fontSize:"10px",
                    letterSpacing:"1px", fontFamily:"'Courier New',monospace" }}>
                  {showSeatMap?"HIDE":"SHOW FULL"}
                </button>
              </div>
              {showSeatMap
                ? <SeatMap available={avSeats} total={totSeats} darkMode={darkMode}/>
                : <div style={{ display:"flex", gap:"3px", flexWrap:"wrap" }}>
                    {Array.from({length:totSeats},(_,i)=>(
                      <div key={i} style={{ width:"14px", height:"11px", borderRadius:"2px",
                        background: i < avSeats ? "#00ff8822" : "#ff3c3c22",
                        border: `1px solid ${i < avSeats ? "#00ff8855":"#ff3c3c44"}`,
                        transition:"all 0.4s" }}/>
                    ))}
                  </div>
              }
            </div>
          </div>

          {/* Leaflet Map + QR */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:"14px", minHeight:"400px" }}>
            {/* Animated Leaflet Map */}
            <div style={{ borderRadius:"6px", overflow:"hidden",
              border:"1px solid rgba(0,200,255,0.2)", position:"relative" }}>
              <BusMap
                key={selectedBus}
                latitude={lat}
                longitude={lng}
                busId={selectedBus}
                darkMode={darkMode}
                speed={data?.speed}
              />
            </div>

            {/* QR + trip info */}
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <div style={{ background:darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.04)",
                border:"1px solid rgba(0,200,255,0.2)", borderRadius:"6px", padding:"16px",
                display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
                <div style={{ color:subC, fontSize:"10px", letterSpacing:"3px" }}>💳 SCAN TO PAY</div>
                <img src={qrImage} alt="UPI QR" style={{ width:"160px", height:"160px",
                  objectFit:"contain", borderRadius:"4px", background:"white", padding:"6px",
                  boxShadow:"0 0 24px rgba(0,200,255,0.15)" }}/>
                <div style={{ textAlign:"center" }}>
                  <div style={{ color:subC, fontSize:"10px", letterSpacing:"2px" }}>TICKET</div>
                  <div style={{ color:"#00c8ff", fontSize:"24px", fontWeight:"bold" }}>{ticket}</div>
                </div>
              </div>

              {/* Bus status summary */}
              <div style={{ background:darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.03)",
                border:"1px solid rgba(255,255,255,0.08)", borderRadius:"6px", padding:"14px",
                display:"flex", flexDirection:"column", gap:"10px" }}>
                <div style={{ color:subC, fontSize:"10px", letterSpacing:"2px" }}>BUS STATUS</div>
                {[
                  { k:"Bus",      v:selectedBus,                         c:ttlC },
                  { k:"Oil",      v:oilOk?"NORMAL ✓":"LOW ⚠",           c:oilOk?"#00ff88":"#ff3c3c" },
                  { k:"Trip",     v:tripActive?"ACTIVE ▶":"IDLE ■",      c:tripActive?"#00ff88":subC },
                  { k:"Updated",  v:lastUpdate||"—",                     c:"#00c8ff" },
                ].map(row=>(
                  <div key={row.k} style={{ display:"flex", justifyContent:"space-between",
                    padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color:subC, fontSize:"10px", letterSpacing:"2px" }}>{row.k}</span>
                    <span style={{ color:row.c, fontSize:"11px", fontWeight:"bold" }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      <footer style={{ textAlign:"center", padding:"10px", background:hdrBg,
        color:subC, fontSize:"10px", letterSpacing:"2px",
        borderTop:`1px solid ${hdrBd}`, position:"fixed", bottom:0, left:0, right:0, zIndex:20 }}>
        ONLINE BUS TRACKING — {user?.username?.toUpperCase()} ({user?.role?.toUpperCase()}) — {selectedBus}
      </footer>
    </div>
  );
}
