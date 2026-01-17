import {
  type FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Address } from "../models/Address.ts";
import type {
  CircleLayerSpecification,
  GeolocateResultEvent,
  LineLayerSpecification,
  MapLayerMouseEvent,
  MapRef,
  StyleSpecification,
  ViewStateChangeEvent,
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
} from "react-map-gl/maplibre";
import Typography from "@mui/material/Typography";
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
  initialPosition,
  initialZoom,
  address,
  showAddresses,
}) => {
  const mapRef = useRef<MapRef>(null);
  const hoveredFeatureIdRef = useRef<number | string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: initialPosition.longitude,
    latitude: initialPosition.latitude,
    zoom: initialZoom,
  });
  const [hoverInfo, setHoverInfo] = useState<{
    longitude: number;
    latitude: number;
    address: string;
    city: string;
    zipcode: string;
  } | null>(null);

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

  const handleMapOnMove = useCallback(
    (e: ViewStateChangeEvent) => setViewState(e.viewState),
    [],
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
      // Clear previous hover state
      if (hoveredFeatureIdRef.current !== null) {
        map.setFeatureState(
          {
            source: "addresses",
            sourceLayer: "addresses",
            id: hoveredFeatureIdRef.current,
          },
          { hover: false },
        );
        hoveredFeatureIdRef.current = null;
      }
      map.getCanvas().style.cursor = "";
      setHoverInfo(null);
      return;
    }

    const feature = e.features[0];
    if (feature.geometry.type !== "Point" || feature.id == null) {
      setHoverInfo(null);
      return;
    }

    // Update hover state
    if (hoveredFeatureIdRef.current !== feature.id) {
      // Clear old hover
      if (hoveredFeatureIdRef.current !== null) {
        map.setFeatureState(
          {
            source: "addresses",
            sourceLayer: "addresses",
            id: hoveredFeatureIdRef.current,
          },
          { hover: false },
        );
      }
      // Set new hover
      map.setFeatureState(
        { source: "addresses", sourceLayer: "addresses", id: feature.id },
        { hover: true },
      );
      hoveredFeatureIdRef.current = feature.id;
    }

    map.getCanvas().style.cursor = "pointer";

    const [longitude, latitude] = feature.geometry.coordinates as [
      number,
      number,
    ];
    setHoverInfo({
      longitude,
      latitude,
      address: feature.properties?.address ?? "",
      city: feature.properties?.city ?? "",
      zipcode: feature.properties?.zipcode ?? "",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    if (hoveredFeatureIdRef.current !== null) {
      map.setFeatureState(
        {
          source: "addresses",
          sourceLayer: "addresses",
          id: hoveredFeatureIdRef.current,
        },
        { hover: false },
      );
      hoveredFeatureIdRef.current = null;
    }
    map.getCanvas().style.cursor = "";
    setHoverInfo(null);
  }, []);

  return (
    <Map
      {...viewState}
      ref={mapRef}
      id={address?.id.toString() ?? "default"}
      onMove={handleMapOnMove}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      minZoom={8}
      maxZoom={17}
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

      {hoverInfo && (
        <Popup
          longitude={hoverInfo.longitude}
          latitude={hoverInfo.latitude}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
        >
          <Typography variant="body2">{hoverInfo.address}</Typography>
          <Typography variant="caption">
            {hoverInfo.city}, {hoverInfo.zipcode}
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
