import { type FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "../models/Address.ts";
import type { LineString } from "../models/LineString.ts";
import type {
  CircleLayerSpecification,
  GeolocateResultEvent,
  LineLayerSpecification,
  MapLayerMouseEvent,
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
  NavigationControl,
  Popup,
  Source
} from "react-map-gl/maplibre";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { LocationPin } from "@mui/icons-material";
import { blue, red } from "@mui/material/colors";
import type { Position } from "../types/app";
import { getAllAddressesInBounds } from "../duckdb/queries/getAllAddressesInBounds.ts";
import type { GeoJSON } from "geojson";
import { getAllServiceLinesInBounds } from "../duckdb/queries/getAllServiceLinesInBounds.ts";
import { getAllOutageLinesInBounds } from "../duckdb/queries/getAllOutageLinesInBounds.ts";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { keyBy } from "lodash-es";
import Typography from "@mui/material/Typography";

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
  },
  layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
};

const serviceLineLayerStyle: LineLayerSpecification = {
  id: "service-lines",
  source: "service-lines",
  type: "line",
  paint: {
    "line-color": blue[800],
    "line-width": 3,
    "line-opacity": 1,
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

// Cluster layers
const clusterLayer: CircleLayerSpecification = {
  id: "address-clusters",
  type: "circle",
  source: "addresses",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      blue[300],
      100,
      blue[500],
      750,
      blue[700],
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
  },
};

const clusterCountLayer: CircleLayerSpecification = {
  id: "cluster-count",
  type: "symbol",
  source: "addresses",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["Noto Sans Regular"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#ffffff",
  },
} as CircleLayerSpecification;

// Individual point layer
const addressesLayer: CircleLayerSpecification = {
  id: "point",
  type: "circle",
  source: "addresses",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": blue[500],
    "circle-radius": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      8,
      4,
    ],
    "circle-stroke-width": 1,
    "circle-stroke-width-transition": {},
    "circle-stroke-color": blue[50],
  },
  layout: {},
};

export const ServiceMap: FunctionComponent<ServiceMapProps> = ({
  initialPosition,
  initialZoom,
  address,
  showAddresses,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const focusedAddressGeoJSONFeatureIdRef = useRef<number | null>(null);
  const [focusedAddressId, setFocusedAddressId] = useState<number | null>(null);
  const [focusedAddress, setFocusedAddress] = useState<Address | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceLines, setServiceLines] = useState<LineString[]>([]);
  const [outageLines, setOutageLines] = useState<LineString[]>([]);
  const [position, setPosition] = useState(initialPosition);
  const [viewState, setViewState] = useState({
    longitude: initialPosition.longitude,
    latitude: initialPosition.latitude,
    zoom: initialZoom,
  });

  const addressesById = useMemo(() => keyBy(addresses, "id"), [addresses]);

  useEffect(() => {
    if (focusedAddressId == null) {
      setFocusedAddress(null);
    } else {
      setFocusedAddress(addressesById[focusedAddressId]);
    }
  }, [focusedAddressId, addressesById]);

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

    if (showAddresses) {
      getAllAddressesInBounds({
        northEastPosition,
        southWestPosition,
      })
        .then((addresses) => setAddresses(addresses))
        .catch((e) => {
          throw e;
        });
    }

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
  }, [position, mapRef, mapReady, showAddresses]);

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

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!e.features || e.features.length === 0) {
      setFocusedAddressId(null);
      return;
    }

    // Find the closest feature to the mouse pointer
    let closestFeature: MapGeoJSONFeature | undefined;
    let minDistance = Infinity;

    for (const feature of e.features) {
      if (feature.geometry.type !== "Point") continue;
      const coords = feature.geometry.coordinates as [number, number];
      const point = map.project(coords);
      const distance = Math.sqrt(
        Math.pow(point.x - e.point.x, 2) + Math.pow(point.y - e.point.y, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestFeature = feature;
      }
    }

    if (!closestFeature?.id) {
      setFocusedAddressId(null);
      return;
    }
    setFocusedAddressId(closestFeature.properties.addressId as number);

    // Clear previous hover state
    if (
      focusedAddressGeoJSONFeatureIdRef.current !== null &&
      focusedAddressGeoJSONFeatureIdRef.current !== closestFeature.id
    ) {
      map.setFeatureState(
        { source: "addresses", id: focusedAddressGeoJSONFeatureIdRef.current },
        { hover: false },
      );
    }

    // Set new hover state
    if (focusedAddressGeoJSONFeatureIdRef.current !== closestFeature.id) {
      map.setFeatureState(
        { source: "addresses", id: closestFeature.id },
        { hover: true },
      );
      focusedAddressGeoJSONFeatureIdRef.current = closestFeature.id as number;
    }

    map.getCanvas().style.cursor = "pointer";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    // Clear hover state
    if (focusedAddressGeoJSONFeatureIdRef.current !== null) {
      map.setFeatureState(
        { source: "addresses", id: focusedAddressGeoJSONFeatureIdRef.current },
        { hover: false },
      );
      focusedAddressGeoJSONFeatureIdRef.current = null;
    }

    map.getCanvas().style.cursor = "";
  }, []);

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    console.log("Map clicked!", e);
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    // Check features from the event first
    const features = e.features || [];
    console.log("Features from event:", features);

    if (!features.length) {
      // Fallback to querying
      const queriedFeatures = map.queryRenderedFeatures(e.point, {
        layers: ["address-clusters"],
      });
      console.log("Queried features:", queriedFeatures);
      features.push(...queriedFeatures);
    }

    if (!features.length) return;

    // Check if this is a cluster
    const feature = features.find((f) => f.properties?.cluster === true);
    console.log("Cluster feature:", feature);
    if (!feature) return;

    const clusterId = feature.properties?.cluster_id;
    console.log("Cluster ID:", clusterId);
    if (clusterId == null) return;

    const geometry = feature.geometry;
    if (geometry.type !== "Point") return;

    // Zoom in by 2 levels when clicking a cluster
    const currentZoom = map.getZoom();
    const targetZoom = Math.min(currentZoom + 2, 15); // Don't exceed maxZoom

    console.log("Zooming from", currentZoom, "to", targetZoom);
    map.easeTo({
      center: geometry.coordinates as [number, number],
      zoom: targetZoom,
      duration: 500,
    });
  }, []);

  const addressesGeoJsonData = useMemo<GeoJSON>(
    () => ({
      type: "FeatureCollection",
      features: addresses.map((address) => ({
        type: "Feature",
        id: address.id,
        properties: {
          addressId: address.id,
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
      onClick={handleMapClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      minZoom={8}
      maxZoom={15}
      interactiveLayerIds={["address-clusters", "point"]}
      mapStyle={mapStyle}
    >
      <AttributionControl />
      <FullscreenControl />
      <GeolocateControl onGeolocate={handleGeolocate} />
      <NavigationControl />

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

      {addresses.length > 0 && (
        <Source
          id="addresses"
          type="geojson"
          data={addressesGeoJsonData}
          cluster={true}
          clusterMaxZoom={13}
          clusterRadius={100}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...addressesLayer} />
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

      {focusedAddress && (
        <Popup
          longitude={focusedAddress.longitude}
          latitude={focusedAddress.latitude}
          anchor="bottom"
          closeButton={undefined}
        >
          <Typography variant="body2">{focusedAddress.address}</Typography>
          <Typography variant="caption">
            {focusedAddress.city}, {focusedAddress.zipcode}
          </Typography>
        </Popup>
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
