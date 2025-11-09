import React, { useState } from "react";
import axios from "axios";

export default function Chatbot({ onResult }) {
  const [messages, setMessages] = useState([
    { role: "system", text: "Ask about deforestation, vegetation change, or urban expansion using natural language." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendQuery() {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const resp = await axios.post("/api/query", { text: input });
      const data = resp.data;
      const aiText = data.analysisText || data.message || "Analysis returned.";

      setMessages((m) => [...m, { role: "assistant", text: aiText }]);

      // pass geojson + bbox to parent so map can zoom & overlay
      if (onResult) {
        onResult({
          bbox: data.bbox,
          geojsonLayers: data.geojsonLayers || []
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", text: "Error running query. See console." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="chat-box">
        {messages.slice(1).map((m, idx) => (
          <div key={idx} className={`msg ${m.role === "user" ? "user" : "ai"}`}>
            <div className="bubble">
              <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 6 }}>{m.role}</div>
              <div>{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about deforestation, urbanization, or satellite change detection..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendQuery();
          }}
        />
        <button className="send-button" onClick={sendQuery} disabled={loading}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
    </>
  );
}