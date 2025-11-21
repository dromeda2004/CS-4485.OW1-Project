import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";

// A tiny wrapper that adds a leaflet.heat layer to the map
export default function HeatmapLayer({ points = [], options = {} }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.L) return;

    // create the heat layer and add to map
    const heat = window.L.heatLayer(points, options).addTo(map);

    // Force update on drag to prevent empty areas, throttled by RAF (so it doesn't lag hella)
    let frame = null;
    const onMove = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        if (heat._reset) {
          heat._reset();
        }
        frame = null;
      });
    };

    map.on("move", onMove);

    return () => {
      map.off("move", onMove);
      if (frame) {
        cancelAnimationFrame(frame);
      }
      map.removeLayer(heat);
    };
    // stringify arrays so effect runs when points/options change
  }, [map, points, options]);

  return null;
}
