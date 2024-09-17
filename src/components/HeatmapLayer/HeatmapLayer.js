import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

function HeatmapLayer({ data }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return; // Certificar-se de que o mapa está inicializado

    if (typeof L.heatLayer !== "function") {
      console.error(
        "L.heatLayer não está disponível. Certifique-se de que o leaflet.heat foi importado corretamente.",
      );
      return;
    }

    // Adicionar a camada de calor apenas se o mapa estiver pronto
    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer(data || [], {
        pane: "heatmapPane",
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.0: "blue",
          0.25: "cyan",
          0.5: "lime",
          0.75: "yellow",
          1.0: "red",
        },
        interactive: false,
      }).addTo(map);
    } else {
      heatLayerRef.current.setLatLngs(data || []);
    }

    // Limpeza quando o componente for desmontado ou os dados mudarem
    return () => {
      if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current); // Remover a camada corretamente
        heatLayerRef.current = null;
      }
    };
  }, [map, data]);

  return null;
}

export default HeatmapLayer;
