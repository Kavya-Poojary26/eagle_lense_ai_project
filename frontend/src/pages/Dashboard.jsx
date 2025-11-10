import React, { useRef } from "react";
import MapView from "../components/MapView";
import Chatbot from "../components/Chatbot";
import mangaluruChanges from "../data/mangaluru_changes.json";

export default function Dashboard() {
  const mapRef = useRef();

  const handleResult = (result) => {
    if (mapRef.current) {
      mapRef.current.zoomToBBox(result.bbox, result.geojsonLayers);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <MapView ref={mapRef} />
      </div>
      <div style={{ height: "200px" }}>
        <Chatbot onResult={handleResult} />
      </div>
      <pre style={{ color: "lime", padding: 10 }}>
        JSON data loaded: {JSON.stringify(mangaluruChanges, null, 2)}
      </pre>
    </div>
  );
}
