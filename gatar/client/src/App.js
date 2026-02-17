import "./App.css";
import { useEffect, useState } from "react";

async function healthCheck() {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function App() {
  const [msg, setMsg] = useState("...");

  useEffect(() => {
    healthCheck()
      .then((d) => setMsg(JSON.stringify(d)))
      .catch((e) => setMsg(String(e)));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>Backend says: {msg}</p>
      </header>
    </div>
  );
}
