import "leaflet/dist/leaflet.css";
import type { FunctionComponent } from "react";
import type { Address } from "../models/Address.ts";
import type { ServiceLine } from "../models/ServiceLine.ts";
import type { FeatureCollection } from "geojson";
import type { LineLayerSpecification } from "react-map-gl/maplibre";
import { Layer, Map, Marker, Source } from "react-map-gl/maplibre";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { LocationPin } from "@mui/icons-material";
import { blue, red } from "@mui/material/colors";

interface MapDemoProps {
  address: Address;
  zoom?: number;
  serviceLines?: ServiceLine[];
}

export const AddressMapPreview: FunctionComponent<MapDemoProps> = ({
  address,
  zoom = 15,
  serviceLines = [],
}) => {
  // Convert service lines to GeoJSON
  const serviceLinesFeatureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: serviceLines.map((line) => ({
      type: "Feature",
      properties: {},
      geometry: line.geometry,
    })),
  };

  // Define line layer style
  const lineLayerStyle: LineLayerSpecification = {
    id: "service-lines",
    source: "service-lines",
    type: "line",
    paint: {
      "line-color": blue[500],
      "line-width": 3,
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  };

  return (
    <Map
      longitude={address.longitude}
      latitude={address.latitude}
      zoom={zoom}
      minZoom={13}
      maxZoom={15}
      pitch={15}
      cursor="auto"
      mapStyle={{
        version: 8,
        glyphs: `${window.location}basemaps-assets-main/fonts/{fontstack}/{range}.pbf`,
        sprite: `${window.location}basemaps-assets-main/sprites/v4/light`,
        sources: {
          protomaps: {
            type: "vector",
            url: "pmtiles:///colorado.pmtiles",
            attribution:
              '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
          },
        },
        layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
      }}
    >
      {/* Service lines layer */}
      {serviceLines.length > 0 && (
        <Source type="geojson" data={serviceLinesFeatureCollection}>
          <Layer {...lineLayerStyle} />
        </Source>
      )}

      <Marker
        longitude={address.longitude}
        latitude={address.latitude}
        anchor="bottom"
      >
        <LocationPin
          fontSize="large"
          sx={{
            color: red[600],
            filter: "drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.35))",
          }}
        />
      </Marker>
    </Map>
  );
};
