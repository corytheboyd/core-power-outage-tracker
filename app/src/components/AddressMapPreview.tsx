import "leaflet/dist/leaflet.css";
import { type FunctionComponent, useEffect, useState } from "react";
import type { Address } from "../models/Address.ts";
import type { LineString } from "../models/LineString.ts";
import type { LineLayerSpecification } from "react-map-gl/maplibre";
import { Layer, Map, Marker, Source } from "react-map-gl/maplibre";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { LocationPin } from "@mui/icons-material";
import { blue, red } from "@mui/material/colors";

interface MapDemoProps {
  address: Address;
  zoom?: number;
  serviceLines?: LineString[];
  outageLines?: LineString[];
}

const serviceLineLayerStyle: LineLayerSpecification = {
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

const outageLineLayerStyle: LineLayerSpecification = {
  id: "outage-lines",
  source: "outage-lines",
  type: "line",
  paint: {
    "line-color": red[500],
    "line-width": 4,
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
};

export const AddressMapPreview: FunctionComponent<MapDemoProps> = ({
  address,
  zoom = 15,
  serviceLines = [],
  outageLines = [],
}) => {
  const [viewState, setViewState] = useState({
    longitude: address.longitude,
    latitude: address.latitude,
    zoom: zoom,
  });

  useEffect(() => {
    setViewState({
      longitude: address.longitude,
      latitude: address.latitude,
      zoom: zoom,
    });
  }, [address, zoom]);

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      minZoom={13}
      maxZoom={15}
      pitch={15}
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
      {outageLines.length > 0 && (
        <Source
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: outageLines.map((line) => ({
              type: "Feature",
              properties: {},
              geometry: line.geometry,
            })),
          }}
        >
          <Layer {...outageLineLayerStyle} />
        </Source>
      )}

      {serviceLines.length > 0 && (
        <Source
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: serviceLines.map((line) => ({
              type: "Feature",
              properties: {},
              geometry: line.geometry,
            })),
          }}
        >
          <Layer {...serviceLineLayerStyle} />
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
