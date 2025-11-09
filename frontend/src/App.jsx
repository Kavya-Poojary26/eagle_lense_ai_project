import React, { useState, useRef } from "react";
import Chatbot from "./components/Chatbot";
import MapView from "./components/MapView";

export default function App() {
  const mapApiRef = useRef(null); // expose map controls
  const [layersToShow, setLayersToShow] = useState([]);

  // called by Chatbot when a query returns
  function handleQueryResult(result) {
    // result: { bbox, analysisText, geojsonLayers }
    if (mapApiRef.current) {
      mapApiRef.current.zoomToBBox(result.bbox, result.geojsonLayers || []);
    }
    setLayersToShow(result.geojsonLayers || []);
  }

  return (
    <div className="app">
      <div className="left">
        <div className="header">
          <div>Garuda Lens</div>
          <div style={{ fontSize: 13, color: "#7b8086" }}>Ask about deforestation, urbanization, NDVI</div>
        </div>

        <Chatbot onResult={handleQueryResult} />
      </div>
      <div className="right">
        <div className="map-card">
          <MapView ref={mapApiRef} initialLayers={layersToShow} />
        </div>
      </div>
    </div>
  );
}