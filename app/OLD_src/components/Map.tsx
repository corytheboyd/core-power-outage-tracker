import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";

interface MapProps {
  features: GeoJSON.Feature[];
}

// Colorado bounds
const COLORADO_CENTER: [number, number] = [39.0, -105.5];
const DEFAULT_ZOOM = 7;

export function Map({ features }: MapProps) {
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features,
    }),
    [features]
  );

  return (
    <MapContainer
      center={COLORADO_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {features.length > 0 && <GeoJSON key={features.length} data={geojson} />}
    </MapContainer>
  );
}
