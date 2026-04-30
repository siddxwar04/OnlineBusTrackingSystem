import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [role,      setRole]      = useState("admin");
  const [username,  setUsername]  = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  // Pre-fill username when switching role
  const handleRoleSwitch = (r) => {
    setRole(r);
    setUsername(r);
    setPassword1(""); setPassword2(""); setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const body = new URLSearchParams({ username });
      if (password1) body.append("password1", password1);
      if (password2) body.append("password2", password2);

      const res  = await fetch("/data/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ role: data.role, username: data.username });
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally { setLoading(false); }
  };

  const isAdmin = role === "admin";
  const accent  = isAdmin ? "#00c8ff" : "#a855f7";
  const hint    = isAdmin
    ? "Username: admin  |  Password 1: admin  or  Password 2: admin1"
    : "Username: driver  |  Password 1: driver  or  Password 2: driver1";

  return (
    <div style={s.page}>
      <div style={s.bgGrid} />
      <div style={{ ...s.bgGlow, background: isAdmin
        ? "radial-gradient(circle, rgba(0,150,255,0.15) 0%, transparent 70%)"
        : "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)" }} />

      <header style={s.header}>
        <div style={s.headerLogo}>
          <span style={s.busIcon}>🚌</span>
          <span style={{ ...s.headerTitle, color: accent }}>ONLINE BUS TRACKING SYSTEM</span>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.heroText}>
          <h1 style={s.heroH1}>Real-Time<br />
            <span style={{ color: accent, textShadow: `0 0 30px ${accent}99` }}>Bus Tracking</span>
          </h1>
          <p style={s.heroSub}>Live GPS · Seat Availability · UPI Payments</p>
        </div>

        <div style={{ ...s.card, borderColor: `${accent}40`, boxShadow: `0 0 40px ${accent}14` }}>
          <div style={{ ...s.cardAccentBar, background: `linear-gradient(90deg, ${accent}, #0050ff)` }} />

          {/* Role Switcher */}
          <div style={s.roleTabs}>
            {["admin","driver"].map(r => (
              <button key={r} style={{
                ...s.roleTab,
                background: role === r ? accent : "transparent",
                color:      role === r ? "#000" : "rgba(255,255,255,0.45)",
                border:     `1px solid ${role === r ? accent : "rgba(255,255,255,0.1)"}`,
              }} onClick={() => handleRoleSwitch(r)}>
                {r === "admin" ? "👑 ADMIN" : "🚌 DRIVER"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            <Field label="USERNAME"   value={username}  onChange={setUsername}  placeholder={`Enter ${role} username`} />
            <Field label="PASSWORD 1" value={password1} onChange={setPassword1} placeholder="Primary password"   type="password" />
            <div style={s.divider}><span style={s.divTxt}>— OR —</span></div>
            <Field label="PASSWORD 2" value={password2} onChange={setPassword2} placeholder="Secondary password" type="password" />

            {error && <div style={s.error}>⚠ {error}</div>}

            <div style={s.hint}>{hint}</div>

            <div style={s.btnRow}>
              <button type="submit" style={{ ...s.btnLogin, background: `linear-gradient(90deg, #0050ff, ${accent})` }}
                disabled={loading}>
                {loading ? "AUTHENTICATING..." : "LOGIN →"}
              </button>
              <button type="button" style={s.btnClear}
                onClick={() => { setUsername(""); setPassword1(""); setPassword2(""); setError(""); }}>
                CLEAR
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer style={s.footer}>Online Bus Tracking System</footer>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
      <label style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", letterSpacing:"2px" }}>{label}</label>
      <input style={s.input} type={type} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

const s = {
  page:         { minHeight:"100vh", background:"linear-gradient(135deg,#0a0a1a 0%,#0d1b3e 50%,#0a1628 100%)", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", fontFamily:"'Courier New',monospace" },
  bgGrid:       { position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(0,200,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.04) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" },
  bgGlow:       { position:"absolute", top:"-20%", left:"50%", transform:"translateX(-50%)", width:"600px", height:"600px", pointerEvents:"none", transition:"background 0.4s" },
  header:       { display:"flex", alignItems:"center", padding:"16px 32px", background:"rgba(0,0,0,0.5)", borderBottom:"1px solid rgba(0,200,255,0.2)", backdropFilter:"blur(10px)", position:"relative", zIndex:10 },
  headerLogo:   { display:"flex", alignItems:"center", gap:"12px" },
  busIcon:      { fontSize:"28px" },
  headerTitle:  { fontSize:"16px", fontWeight:"bold", letterSpacing:"3px", transition:"color 0.3s" },
  main:         { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"80px", padding:"40px 60px", position:"relative", zIndex:5, flexWrap:"wrap" },
  heroText:     { textAlign:"left", maxWidth:"360px" },
  heroH1:       { fontSize:"56px", fontWeight:"900", color:"white", lineHeight:1.1, margin:"0 0 16px 0" },
  heroSub:      { color:"rgba(255,255,255,0.5)", fontSize:"14px", letterSpacing:"2px", margin:0 },
  card:         { background:"rgba(255,255,255,0.04)", border:"1px solid", borderRadius:"4px", padding:"40px", width:"340px", backdropFilter:"blur(20px)", position:"relative", transition:"box-shadow 0.4s,border-color 0.4s" },
  cardAccentBar:{ position:"absolute", top:0, left:0, right:0, height:"3px", borderRadius:"4px 4px 0 0", transition:"background 0.4s" },
  roleTabs:     { display:"flex", gap:"8px", marginBottom:"24px" },
  roleTab:      { flex:1, padding:"9px", borderRadius:"3px", cursor:"pointer", fontSize:"12px", fontWeight:"bold", letterSpacing:"2px", fontFamily:"'Courier New',monospace", transition:"all 0.2s" },
  form:         { display:"flex", flexDirection:"column", gap:"14px" },
  input:        { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(0,200,255,0.2)", borderRadius:"3px", padding:"10px 14px", color:"white", fontSize:"14px", outline:"none", fontFamily:"'Courier New',monospace" },
  divider:      { textAlign:"center" },
  divTxt:       { color:"rgba(255,255,255,0.25)", fontSize:"12px", letterSpacing:"2px" },
  error:        { background:"rgba(255,60,60,0.1)", border:"1px solid rgba(255,60,60,0.3)", borderRadius:"3px", padding:"10px 14px", color:"#ff6b6b", fontSize:"13px" },
  hint:         { color:"rgba(255,255,255,0.2)", fontSize:"10px", letterSpacing:"1px", textAlign:"center" },
  btnRow:       { display:"flex", gap:"10px", marginTop:"4px" },
  btnLogin:     { flex:2, color:"white", border:"none", borderRadius:"3px", padding:"12px", cursor:"pointer", fontSize:"13px", fontWeight:"bold", letterSpacing:"2px", fontFamily:"'Courier New',monospace", boxShadow:"0 4px 20px rgba(0,200,255,0.3)", transition:"background 0.4s" },
  btnClear:     { flex:1, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"3px", padding:"12px", cursor:"pointer", fontSize:"13px", letterSpacing:"2px", fontFamily:"'Courier New',monospace" },
  footer:       { textAlign:"center", padding:"14px", background:"rgba(0,0,0,0.5)", color:"rgba(255,255,255,0.3)", fontSize:"12px", letterSpacing:"1px", borderTop:"1px solid rgba(0,200,255,0.1)", position:"relative", zIndex:10 },
};
