import React from "react";
import { Fab } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";

function HeatmapToggleButton({ showHeatmap, setShowHeatmap }) {
  const handleClick = () => {
    setShowHeatmap(!showHeatmap);
  };

  return (
    <Fab
      color="secondary"
      aria-label="toggle heatmap"
      onClick={handleClick}
      style={{
        position: "absolute",
        top: "80px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      <WhatshotIcon />
    </Fab>
  );
}

export default HeatmapToggleButton;
