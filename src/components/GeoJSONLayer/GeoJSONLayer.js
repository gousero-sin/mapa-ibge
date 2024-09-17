import React from "react";
import { GeoJSON } from "react-leaflet";

function GeoJSONLayer({ data, style, onEachFeature }) {
  return (
    <GeoJSON
      data={data}
      style={style}
      onEachFeature={onEachFeature}
      pane="geojsonPane" // Usar o pane definido no MapContainer
    />
  );
}

export default GeoJSONLayer;
