import {
  type FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Address } from "../models/Address.ts";
import type { LineString } from "../models/LineString.ts";
import type {
  CircleLayerSpecification,
  GeolocateResultEvent,
  LineLayerSpecification,
  MapRef,
  StyleSpecification,
} from "react-map-gl/maplibre";
import {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl/maplibre";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { LocationPin } from "@mui/icons-material";
import { blue, red } from "@mui/material/colors";
import type { Position } from "../types/app";
import type { ViewStateChangeEvent } from "react-map-gl/mapbox-legacy";
import { getAllAddressesInBounds } from "../duckdb/queries/getAllAddressesInBounds.ts";
import type { GeoJSON } from "geojson";
import { getAllServiceLinesInBounds } from "../duckdb/queries/getAllServiceLinesInBounds.ts";
import { getAllOutageLinesInBounds } from "../duckdb/queries/getAllOutageLinesInBounds.ts";

export interface ServiceMapOnSelectAddressFunction {
  (address: Address): void;
}

interface ServiceMapProps {
  initialPosition: Position;
  initialZoom: number;
  address?: Address;
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
  },
  layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
};

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
    "line-width": 4,
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
};

const addressesLayer: CircleLayerSpecification = {
  id: "point",
  type: "circle",
  source: "addresses",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": blue[300],
    "circle-radius": 4,
    "circle-stroke-width": 1,
    "circle-stroke-color": blue[50],
  },
};

export const ServiceMap: FunctionComponent<ServiceMapProps> = ({
  initialPosition,
  initialZoom,
  address,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceLines, setServiceLines] = useState<LineString[]>([]);
  const [outageLines, setOutageLines] = useState<LineString[]>([]);
  const [position, setPosition] = useState(initialPosition);
  const [viewState, setViewState] = useState({
    longitude: initialPosition.longitude,
    latitude: initialPosition.latitude,
    zoom: initialZoom,
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

  useEffect(() => {
    if (!mapReady) return;
    if (!mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    const mapBoundsNorthEast = bounds.getNorthEast();
    const mapBoundsSouthWest = bounds.getSouthWest();
    const northEastPosition: Position = {
      latitude: mapBoundsNorthEast.lat,
      longitude: mapBoundsNorthEast.lng,
    };
    const southWestPosition: Position = {
      latitude: mapBoundsSouthWest.lat,
      longitude: mapBoundsSouthWest.lng,
    };

    getAllAddressesInBounds({
      northEastPosition,
      southWestPosition,
    })
      .then((addresses) => setAddresses(addresses))
      .catch((e) => {
        throw e;
      });

    getAllServiceLinesInBounds({
      northEastPosition,
      southWestPosition,
    })
      .then((serviceLines) => setServiceLines(serviceLines))
      .catch((e) => {
        throw e;
      });

    getAllOutageLinesInBounds({
      northEastPosition,
      southWestPosition,
    })
      .then((outageLines) => setOutageLines(outageLines))
      .catch((e) => {
        throw e;
      });
  }, [position, mapRef, mapReady]);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleMapOnMove = useCallback(
    (e: ViewStateChangeEvent) => setViewState(e.viewState),
    [],
  );

  const handleMapOnMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      const newPosition = {
        longitude: e.viewState.longitude,
        latitude: e.viewState.latitude,
      };
      if (newPosition == position) return;
      setPosition({
        longitude: e.viewState.longitude,
        latitude: e.viewState.latitude,
      });
    },
    [position],
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

  const addressesGeoJsonData = useMemo<GeoJSON>(
    () => ({
      type: "FeatureCollection",
      features: addresses.map((address) => ({
        type: "Feature",
        properties: {
          address,
        },
        geometry: {
          type: "Point",
          coordinates: [address.longitude, address.latitude],
        },
      })),
    }),
    [addresses],
  );

  const serviceLinesGeoJsonData = useMemo<GeoJSON>(
    () => ({
      type: "FeatureCollection",
      features: serviceLines.map((line) => ({
        type: "Feature",
        properties: {},
        geometry: line.geometry,
      })),
    }),
    [serviceLines],
  );

  const outageLinesGeoJsonData = useMemo<GeoJSON>(
    () => ({
      type: "FeatureCollection",
      features: outageLines.map((line) => ({
        type: "Feature",
        properties: {},
        geometry: line.geometry,
      })),
    }),
    [outageLines],
  );

  return (
    <Map
      {...viewState}
      ref={mapRef}
      id={address?.id.toString() ?? "default"}
      onLoad={handleMapLoad}
      onMove={handleMapOnMove}
      onMoveEnd={handleMapOnMoveEnd}
      minZoom={13}
      maxZoom={15}
      interactiveLayerIds={["address-clusters"]}
      mapStyle={mapStyle}
    >
      <AttributionControl />
      <FullscreenControl />
      <GeolocateControl onGeolocate={handleGeolocate} />
      <NavigationControl />

      {addresses.length > 0 && (
        <Source id="addresses" type="geojson" data={addressesGeoJsonData}>
          <Layer {...addressesLayer} />
        </Source>
      )}

      {serviceLines.length > 0 && (
        <Source type="geojson" data={serviceLinesGeoJsonData}>
          <Layer {...serviceLineLayerStyle} />
        </Source>
      )}

      {outageLines.length > 0 && (
        <Source type="geojson" data={outageLinesGeoJsonData}>
          <Layer {...outageLineLayerStyle} />
        </Source>
      )}

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
