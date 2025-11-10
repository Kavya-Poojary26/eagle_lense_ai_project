import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("✅ Frontend: main.jsx loaded");

const rootEl = document.getElementById("root");

if (!rootEl) {
  console.error("❌ Cannot find <div id='root'></div> in index.html");
} else {
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("🚀 App rendered successfully!");
}
