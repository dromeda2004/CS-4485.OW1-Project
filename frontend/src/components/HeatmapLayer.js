import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";

// A tiny wrapper that adds a leaflet.heat layer to the map
export default function HeatmapLayer({ points = [], options = {} }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.L) return;

    // create the heat layer and add to map
    const heatLayer = window.L.heatLayer(points, options).addTo(map);

    return () => {
      if (map && heatLayer) map.removeLayer(heatLayer);
    };
    // stringify arrays so effect runs when points/options change
  }, [map, JSON.stringify(points), JSON.stringify(options)]);

  return null;
}
