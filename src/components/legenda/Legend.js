import React from "react";
import "./Legend.css";

function Legend({ viewMode, densityColorScale, temperatureColorScale }) {
  const hexToRgb = (hex) => {
    // Remove o '#' se estiver presente
    hex = hex.replace("#", "");

    // Converte a string hexadecimal em valores RGB
    let r, g, b;

    if (hex.length === 3) {
      // Cores hexadecimais de 3 dígitos
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      // Cores hexadecimais de 6 dígitos
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      // Formato inválido
      r = g = b = 0;
    }

    return [r, g, b];
  };

  const gradient = (colorScale) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    const imageData = ctx.createImageData(1, 256);
    const { data } = imageData;

    for (let i = 0; i < 256; i++) {
      const color = colorScale(i / 255);
      const [r, g, b] = hexToRgb(color);

      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  };

  const colorScale =
    viewMode === "density" ? densityColorScale : temperatureColorScale;
  const title =
    viewMode === "density"
      ? "Densidade Populacional (hab/km²)"
      : "Temperatura (°C)";

  return (
    <div className="legend">
      <div className="legend-title">{title}</div>
      <div
        className="legend-scale"
        style={{
          backgroundImage: `url(${gradient(colorScale)})`,
        }}
      ></div>
      <div className="legend-labels">
        <div>{viewMode === "density" ? "0" : "10"}</div>
        <div>{viewMode === "density" ? "200" : "40"}</div>
      </div>
    </div>
  );
}

export default Legend;
