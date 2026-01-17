import { type FunctionComponent, useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "../models/Address.ts";
import type {
  CircleLayerSpecification,
  GeolocateResultEvent,
  LineLayerSpecification,
  MapRef,
  StyleSpecification,
  ViewStateChangeEvent
} from "react-map-gl/maplibre";
import {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  Layer,
  Map,
  Marker,
  NavigationControl
} from "react-map-gl/maplibre";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { LocationPin } from "@mui/icons-material";
import { blue, red } from "@mui/material/colors";
import type { Position } from "../types/app";

export interface ServiceMapOnSelectAddressFunction {
  (address: Address): void;
}

interface ServiceMapProps {
  initialPosition: Position;
  initialZoom: number;
  address?: Address;
  showAddresses: boolean;
  onSelectAddress?: ServiceMapOnSelectAddressFunction;
}

const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: `${window.location}basemaps-assets-main/fonts/{fontstack}/{range}.pbf`,
  sprite: `${window.location}basemaps-assets-main/sprites/v4/light`,
  sources: {
    protomaps: {
      type: "vector",
      url: "pmtiles:///colorado.pmtiles",
    },
    addresses: {
      type: "vector",
      url: "pmtiles:///addresses.pmtiles",
    },
    service_lines: {
      type: "vector",
      url: "pmtiles:///service_lines.pmtiles",
    },
  },
  layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
};

// Service lines layer (from vector tiles)
const serviceLineLayer: LineLayerSpecification = {
  id: "service-lines",
  type: "line",
  source: "service_lines",
  "source-layer": "service_lines",
  paint: {
    "line-color": blue[800],
    "line-width": 1,
    "line-opacity": 1,
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
};

// Address point layer (from vector tiles)
const addressPointLayer: CircleLayerSpecification = {
  id: "address-points",
  type: "circle",
  source: "addresses",
  "source-layer": "addresses",
  paint: {
    "circle-color": blue[500],
    "circle-radius": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      8,
      4,
    ],
    "circle-stroke-width": 1,
    "circle-stroke-color": blue[50],
  },
};

export const ServiceMap: FunctionComponent<ServiceMapProps> = ({
  address,
  showAddresses,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: -104.93648013699999,
    latitude: 39.556234023297634,
    zoom: 7.6,
  });

  useEffect(() => {
    if (!address) return;
    if (!mapRef.current) return;

    mapRef.current.jumpTo({
      zoom: 15,
      center: {
        lat: address.latitude,
        lng: address.longitude,
      },
    });
  }, [address]);

  const onMapSettled = useCallback(() => {
    console.log("viewState", viewState);
  }, [viewState]);

  const handleMapOnMove = useCallback(
    (e: ViewStateChangeEvent) => {
      setViewState(e.viewState);
      onMapSettled();
    },
    [onMapSettled],
  );

  const handleGeolocate = useCallback((e: GeolocateResultEvent) => {
    mapRef.current?.jumpTo({
      zoom: 15,
      center: {
        lat: e.coords.latitude,
        lng: e.coords.longitude,
      },
    });
  }, []);

  return (
    <Map
      {...viewState}
      ref={mapRef}
      id={address?.id.toString() ?? "default"}
      onMove={handleMapOnMove}
      minZoom={7}
      maxZoom={17}
      maxBounds={[
        [-106.37445371899994, 38.45637502400004],
        [-103.49850655499998, 40.42145575600003],
      ]}
      interactiveLayerIds={["address-points"]}
      mapStyle={mapStyle}
    >
      <AttributionControl />
      <FullscreenControl />
      <GeolocateControl onGeolocate={handleGeolocate} />
      <NavigationControl />

      <Layer {...serviceLineLayer} />
      {showAddresses && <Layer {...addressPointLayer} />}

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
    }}
  />
);
