import { useState } from "react";
import LoginPage   from "./LoginPage";
import Dashboard   from "./Dashboard";
import PublicBoard from "./PublicBoard";

export default function App() {
  const [user, setUser]           = useState(null);   // { role, username }
  const [darkMode, setDarkMode]   = useState(true);
  const [showPublic, setShowPublic] = useState(false);

  if (showPublic) {
    return <PublicBoard darkMode={darkMode} onBack={() => setShowPublic(false)} />;
  }
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }
  return (
    <Dashboard
      user={user}
      onLogout={() => setUser(null)}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      onPublicBoard={() => setShowPublic(true)}
    />
  );
}
