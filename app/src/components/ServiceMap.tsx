import "leaflet/dist/leaflet.css";
import {
  type FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { Address } from "../models/Address.ts";
import type { LineString } from "../models/LineString.ts";
import type { LineLayerSpecification } from "react-map-gl/maplibre";
import {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  Map,
  Marker,
  NavigationControl,
} from "react-map-gl/maplibre";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { LocationPin } from "@mui/icons-material";
import { blue, red } from "@mui/material/colors";
import { getNearbyServiceLines } from "../duckdb/queries/getNearbyServiceLines.ts";
import { getNearbyOutageLines } from "../duckdb/queries/getNearbyOutageLines.ts";
import type { Position } from "../types/app";
import type { GeolocateResultEvent } from "react-map-gl/mapbox-legacy";

export interface ServiceMapOnSelectAddressFunction {
  (address: Position): void;
}

interface ServiceMapProps {
  position: Position;
  zoom: number;
  address?: Address;
  onSelectPosition?: ServiceMapOnSelectAddressFunction;
}

const serviceLineLayerStyle: LineLayerSpecification = {
  id: "service-lines",
  source: "service-lines",
  type: "line",
  paint: {
    "line-color": blue[500],
    "line-width": 3,
    "line-opacity": 0.5,
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
    "line-width": 6,
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
};

export const ServiceMap: FunctionComponent<ServiceMapProps> = ({
  position,
  zoom,
  address,
  onSelectPosition,
}) => {
  const [serviceLines, setServiceLines] = useState<LineString[]>([]);
  const [outageLines, setOutageLines] = useState<LineString[]>([]);
  const [viewState, setViewState] = useState({
    longitude: position.longitude,
    latitude: position.latitude,
    zoom: zoom,
  });

  useEffect(() => {
    getNearbyServiceLines({
      latitude: position.latitude,
      longitude: position.longitude,
    })
      .then((serviceLines) => {
        console.log("serviceLines", serviceLines);
        setServiceLines(serviceLines);
      })
      .catch((e) => {
        throw e;
      });

    getNearbyOutageLines({
      latitude: position.latitude,
      longitude: position.longitude,
    })
      .then((outageLines) => {
        console.log("outageLines", outageLines);
        setOutageLines(outageLines);
      })
      .catch((e) => {
        throw e;
      });
  }, [position]);

  useEffect(() => {
    setViewState({
      longitude: position.longitude,
      latitude: position.latitude,
      zoom: zoom,
    });
  }, [position, zoom]);

  const handleOnGeolocate = useCallback(
    (e: GeolocateResultEvent) => {
      if (!onSelectPosition) {
        return;
      }
      onSelectPosition({
        latitude: e.coords.latitude,
        longitude: e.coords.longitude,
      });
    },
    [onSelectPosition],
  );

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      minZoom={13}
      maxZoom={15}
      mapStyle={{
        version: 8,
        glyphs: `${window.location}basemaps-assets-main/fonts/{fontstack}/{range}.pbf`,
        sprite: `${window.location}basemaps-assets-main/sprites/v4/light`,
        sources: {
          protomaps: {
            type: "vector",
            url: "pmtiles:///colorado.pmtiles",
          },
        },
        layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
      }}
    >
      <AttributionControl />
      <FullscreenControl position="top-left" />
      <GeolocateControl onGeolocate={handleOnGeolocate} />
      <NavigationControl />

      {/*{outageLines.length > 0 && (*/}
      {/*  <Source*/}
      {/*    type="geojson"*/}
      {/*    data={{*/}
      {/*      type: "FeatureCollection",*/}
      {/*      features: outageLines.map((line) => ({*/}
      {/*        type: "Feature",*/}
      {/*        properties: {},*/}
      {/*        geometry: line.geometry,*/}
      {/*      })),*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <Layer {...outageLineLayerStyle} />*/}
      {/*  </Source>*/}
      {/*)}*/}
      {/*{serviceLines.length > 0 && (*/}
      {/*  <Source*/}
      {/*    type="geojson"*/}
      {/*    data={{*/}
      {/*      type: "FeatureCollection",*/}
      {/*      features: serviceLines.map((line) => ({*/}
      {/*        type: "Feature",*/}
      {/*        properties: {},*/}
      {/*        geometry: line.geometry,*/}
      {/*      })),*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <Layer {...serviceLineLayerStyle} />*/}
      {/*  </Source>*/}
      {/*)}*/}

      {address && (
        <Marker
          longitude={address.longitude}
          latitude={address.latitude}
          anchor="bottom"
        >
          <RedPin />
        </Marker>
      )}
    </Map>
  );
};

const RedPin: FunctionComponent = () => (
  <LocationPin
    fontSize="large"
    sx={{
      color: red[600],
      filter: "drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.35))",
    }}
  />
);

const BluePin: FunctionComponent = () => (
  <LocationPin
    fontSize="large"
    sx={{
      color: red[600],
      filter: "drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.35))",
    }}
  />
);
