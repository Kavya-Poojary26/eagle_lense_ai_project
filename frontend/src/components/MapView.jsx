import React, { useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";

/*
MapView exposes a zoomToBBox(bbox, layers) method via ref:
- bbox: [minLon, minLat, maxLon, maxLat]
- layers: [{ id, type: 'change'|'heatmap', geojson }]
*/

function MapInner({ initialLayers, setMapRef }) {
  const map = useMap();
  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);
  return null;
}

const MapView = forwardRef(({ initialLayers = [] }, ref) => {
  const mapRef = useRef(null);
  const layerRefs = useRef([]);

  useImperativeHandle(ref, () => ({
    // called by App when query returns
    zoomToBBox(bbox, layers = []) {
      if (!bbox || bbox.length !== 4) return;
      const [minLon, minLat, maxLon, maxLat] = bbox;
      const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds.pad(0.3));
        // clear previous layers
        layerRefs.current.forEach((lr) => lr && mapRef.current.removeLayer(lr));
        layerRefs.current = [];

        // add new layers
        layers.forEach((layer) => {
          try {
            const g = L.geoJSON(layer.geojson, {
              style: layer.style || (() => ({ color: "#ff6b6b", fillOpacity: 0.4 }))
            }).addTo(mapRef.current);
            layerRefs.current.push(g);
          } catch (err) {
            console.error("Invalid geojson", err);
          }
        });
      }
    }
  }));

  return (
    <MapContainer style={{ height: "100%", borderRadius: 8 }} center={[20, 78]} zoom={5} scrollWheelZoom={true}>
      <MapInner setMapRef={(m) => (mapRef.current = m)} initialLayers={initialLayers} />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
});

export default MapView;