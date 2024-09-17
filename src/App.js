import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, LayersControl, Pane } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Legend from "./components/legenda/Legend";
import { AppBar, Toolbar, Typography, Container, Button } from "@mui/material";
import HeatmapLayer from "./components/HeatmapLayer/HeatmapLayer";
import GeoJSONLayer from "./components/GeoJSONLayer/GeoJSONLayer";
import HeatmapToggleButton from "./components/HeatmapToggleButton/HeatmapToggleButton";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import L from "leaflet";
import "./App.css";

function App() {
  const [geoData, setGeoData] = useState(null);
  const [viewMode, setViewMode] = useState("temperature");
  const [temperatureData, setTemperatureData] = useState({});
  const [heatData, setHeatData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const geoJsonLayersRef = useRef({});
  const stateIds = ["SP", "GO"];

  const stateCoordinates = {
    SP: { latitude: -23.5505, longitude: -46.6333 },
    GO: { latitude: -16.6869, longitude: -49.2648 },
  };

  const densityData = {
    SP: 166.23,
    GO: 17.74,
  };

  const densityColorScale = scaleSequential(interpolateYlOrRd).domain([0, 200]);
  const temperatureColorScale = scaleSequential(interpolateYlOrRd).domain([
    10, 40,
  ]);

  useEffect(() => {
    // Atualizar os popups quando a temperatura mudar
    Object.keys(geoJsonLayersRef.current).forEach((id) => {
      const layer = geoJsonLayersRef.current[id];
      if (layer) {
        const temp = temperatureData[id];
        const tempInfo =
          temp !== undefined && temp !== null
            ? `<br><strong>Temperatura:</strong> ${temp.toFixed(1)} °C`
            : "<br><strong>Temperatura:</strong> Dados não disponíveis";

        layer.bindPopup(`<strong>Estado:</strong> ${id}${tempInfo}`);
      }
    });
  }, [temperatureData]);

  useEffect(() => {
    const fetchGeoData = async () => {
      const features = [];

      for (let id of stateIds) {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${id}?formato=application/vnd.geo+json`,
        );
        const geometry = await response.json();

        const feature = {
          type: "Feature",
          geometry: geometry,
          properties: {
            id: id,
          },
        };

        features.push(feature);
      }

      setGeoData({
        type: "FeatureCollection",
        features: features,
      });
    };

    fetchGeoData();
  }, []);

  useEffect(() => {
    const fetchTemperatureData = async () => {
      const tempData = {};

      for (let id of stateIds) {
        const { latitude, longitude } = stateCoordinates[id];

        const params = new URLSearchParams({
          latitude: latitude,
          longitude: longitude,
          current_weather: true,
          timezone: "America/Sao_Paulo",
        });

        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          );
          const data = await response.json();

          const currentTemp = data.current_weather.temperature;

          tempData[id] = currentTemp;
        } catch (error) {
          console.error(
            `Erro ao obter dados de temperatura para ${id}:`,
            error,
          );
        }
      }

      setTemperatureData(tempData);
    };

    fetchTemperatureData();

    const interval = setInterval(() => {
      fetchTemperatureData();
    }, 1000); // Atualizar a cada 1 segundo

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Object.keys(temperatureData).length === 0) return;

    const generateHeatData = () => {
      const data = [];

      // Temperaturas dos estados
      const temps = {
        SP: temperatureData["SP"] || 20,
        GO: temperatureData["GO"] || 20,
      };

      // Dados dos estados
      const statesData = {
        SP: {
          bounds: [
            [-24.0, -54.0],
            [-20.0, -44.0],
          ],
          temp: temps["SP"],
        },
        GO: {
          bounds: [
            [-19.5, -52.0],
            [-12.0, -46.0],
          ],
          temp: temps["GO"],
        },
      };

      // Definir o intervalo de temperatura esperado
      const tempMin = 10; // Temperatura mínima esperada
      const tempMax = 40; // Temperatura máxima esperada

      Object.keys(statesData).forEach((state) => {
        const { bounds, temp } = statesData[state];

        // Normalizar a intensidade para o intervalo [0, 1]
        let baseIntensity = (temp - tempMin) / (tempMax - tempMin);
        baseIntensity = Math.min(Math.max(baseIntensity, 0), 1); // Garantir que esteja entre 0 e 1

        // Ajustar a intensidade para amplificar as diferenças
        const adjustedIntensity = Math.pow(baseIntensity, 2); // Elevar ao quadrado para aumentar o contraste

        const [latMin, lngMin] = bounds[0];
        const [latMax, lngMax] = bounds[1];

        for (let i = 0; i < 200; i++) {
          let latitude = latMin + Math.random() * (latMax - latMin);
          let longitude = lngMin + Math.random() * (lngMax - lngMin);

          // Adicionar deslocamento aleatório para melhorar a distribuição
          latitude += (Math.random() - 0.5) * 0.2;
          longitude += (Math.random() - 0.5) * 0.2;

          // Randomizar a intensidade para variar entre 80% e 120% do valor base ajustado
          const intensity = Math.min(
            Math.max(adjustedIntensity * (0.8 + Math.random() * 0.4), 0),
            1,
          );

          data.push([latitude, longitude, intensity]);
        }
      });

      return data;
    };

    setHeatData(generateHeatData());

    const interval = setInterval(() => {
      setHeatData(generateHeatData());
    }, 1000); // Atualizar a cada 1 segundo

    return () => clearInterval(interval);
  }, [temperatureData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getColor = (id) => {
    if (viewMode === "density") {
      return densityColorScale(densityData[id]);
    } else if (viewMode === "temperature") {
      const value = temperatureData[id];
      if (value === undefined || value === null) {
        return "#FFFFFF";
      }
      return temperatureColorScale(value);
    }
  };

  // Função para destacar a região
  const highlightFeature = (e) => {
    const layer = e.target;

    layer.setStyle({
      weight: 3,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.7,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  };

  // Função para redefinir o destaque
  const resetHighlight = (e) => {
    e.target.setStyle(style(e.target.feature));
  };

  // Função para fazer zoom na região ao clicar (opcional)
  const zoomToFeature = (e) => {
    const map = e.target._map;
    map.fitBounds(e.target.getBounds());
  };

  // Função de estilo
  const style = (feature) => {
    const id = feature.properties.id;
    return {
      fillColor: getColor(id),
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature, layer) => {
    const id = feature.properties.id;

    // Armazenar a layer no ref
    geoJsonLayersRef.current[id] = layer;

    layer.setStyle(style(feature));

    // Adicionar ouvintes de eventos
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature, // opcional
    });
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  return (
    <>
      {/* ... (código do AppBar permanece o mesmo) */}
      <Container
        maxWidth="lg"
        style={{ marginTop: "20px", position: "relative" }}
      >
        <MapContainer
          center={[-21.0, -49.0]}
          zoom={5}
          minZoom={4}
          maxZoom={10}
          style={{ height: "600px", width: "100%" }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Mapa Padrão">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          {/* Definir o Pane para o GeoJSON com zIndex maior para interatividade */}
          <Pane name="geojsonPane" style={{ zIndex: 400 }}>
            {geoData && (
              <GeoJSONLayer
                data={geoData}
                style={style}
                onEachFeature={onEachFeature}
              />
            )}
          </Pane>
          {/* Definir o Pane para o Heatmap com zIndex menor */}
          <Pane name="heatmapPane" style={{ zIndex: 350 }}>
            {showHeatmap && heatData.length > 0 && (
              <HeatmapLayer data={heatData} />
            )}
          </Pane>
          <Legend
            viewMode={viewMode}
            densityColorScale={densityColorScale}
            temperatureColorScale={temperatureColorScale}
          />
        </MapContainer>
        {/* Botão para alternar o heatmap */}
        <HeatmapToggleButton
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
        />
        {/* Painel Lateral com Informações dos Estados */}
        <div className="sidebar">
          <h3>Informações dos Estados</h3>
          {stateIds.map((id) => (
            <div key={id}>
              <h4>{id}</h4>
              <p>
                Temperatura:{" "}
                {temperatureData[id]
                  ? `${temperatureData[id].toFixed(1)} °C`
                  : "Carregando..."}
              </p>
              {/* Outras informações podem ser adicionadas aqui */}
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

export default App;
