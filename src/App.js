// Import necessary dependencies
import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { S2 } from 's2-geometry';
import './App.css';

const App = () => {
  const [map, setMap] = useState(null);
  const [s2CellIds, setS2CellIds] = useState('');

  useEffect(() => {
    // Initialize MapLibre map
    const mapInstance = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-0.1276, 51.5074], // Default to London
      zoom: 10,
    });

    setMap(mapInstance);

    return () => mapInstance.remove(); // Cleanup on unmount
  }, []);

  const drawS2Cells = () => {
    if (!map) return;

    // Remove existing S2 cell layers if any
    const existingLayers = map.getStyle().layers;
    existingLayers.forEach((layer) => {
      if (layer.id.startsWith('s2-cell-')) {
        map.removeLayer(layer.id);
        map.removeSource(layer.id);
      }
    });

    const cellIds = s2CellIds.split('\n').map(id => id.trim()).filter(id => id !== '');
    cellIds.forEach((cellId, index) => {
      try {
        const cell = S2.S2Cell.FromHilbertQuadKey(cellId);
        const vertices = cell.getCornerLatLngs();
        const coordinates = vertices.map(({ lat, lng }) => [lng, lat]);
        coordinates.push(coordinates[0]); // Close the polygon

        map.addSource(`s2-cell-${index}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coordinates],
            },
          },
        });

        map.addLayer({
          id: `s2-cell-${index}`,
          type: 'line',
          source: `s2-cell-${index}`,
          paint: {
            'line-color': '#FF0000',
            'line-width': 2,
          },
        });
      } catch (error) {
        console.error(`Invalid S2 cell ID: ${cellId}`);
      }
    });
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Enter S2 Cell IDs</h2>
        <textarea
          placeholder="Enter S2 Cell IDs separated by new lines"
          value={s2CellIds}
          onChange={(e) => setS2CellIds(e.target.value)}
        />
        <button onClick={drawS2Cells}>Visualize</button>
      </div>
      <div id="map" className="map"></div>
    </div>
  );
};

export default App;
