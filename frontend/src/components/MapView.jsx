import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapView = forwardRef((props, ref) => {
  const mapRef = useRef();

  useImperativeHandle(ref, () => ({
    zoomToBBox(bbox, geojsonLayers) {
      console.log("zoomToBBox called:", bbox, geojsonLayers);
      if (!mapRef.current) return;
      // TODO: implement Leaflet fitBounds logic here
    }
  }));

  return (
    <MapContainer
      center={[12.91, 74.85]} // Mangalore coordinates
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    </MapContainer>
  );
});

export default MapView;
