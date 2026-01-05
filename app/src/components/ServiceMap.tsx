import { type FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "../models/Address.ts";
import type { LineString } from "../models/LineString.ts";
import type {
  CircleLayerSpecification,
  LineLayerSpecification,
  MapRef,
  StyleSpecification,
  SymbolLayerSpecification
} from "react-map-gl/maplibre";
import {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source
} from "react-map-gl/maplibre";
import { layers, namedFlavor } from "@protomaps/basemaps";
import { Circle, LocationPin } from "@mui/icons-material";
import { blue, red } from "@mui/material/colors";
import type { Position } from "../types/app";
import type { ViewStateChangeEvent } from "react-map-gl/mapbox-legacy";
import type { AddressCluster } from "../models/AddressCluster.ts";
import { getAllAddressesInBounds } from "../duckdb/queries/getAllAddressesInBounds.ts";
import type { GeoJSON } from "geojson";

export interface ServiceMapOnSelectAddressFunction {
  (address: Address): void;
}

interface ServiceMapProps {
  initialPosition: Position;
  initialZoom: number;
  address?: Address;
  onSelectAddress?: ServiceMapOnSelectAddressFunction;
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

const clusterLayer: CircleLayerSpecification = {
  id: "address-clusters",
  type: "circle",
  source: "addresses",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#51bbd6", // color for small clusters
      100,
      "#f1f075", // color for medium clusters
      750,
      "#f28cb1", // color for large clusters
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      20, // radius for small clusters
      100,
      30, // radius for medium clusters
      750,
      40, // radius for large clusters
    ],
  },
};

const unclusteredPointLayer: CircleLayerSpecification = {
  id: "unclustered-point",
  type: "circle",
  source: "addresses",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#11b4da",
    "circle-radius": 4,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

const clusterCountLayer: SymbolLayerSpecification = {
  id: "cluster-count",
  type: "symbol",
  source: "address-clusters",
  layout: {
    "text-field": ["get", "count"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

export const ServiceMap: FunctionComponent<ServiceMapProps> = ({
  initialPosition,
  initialZoom,
  address,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);

  const [addressClusters, setAddressClusters] = useState<AddressCluster[]>([]);
  const [addressesInBounds, setAddressesInBounds] = useState<Address[]>([]);
  const [serviceLines, setServiceLines] = useState<LineString[]>([]);
  const [outageLines, setOutageLines] = useState<LineString[]>([]);
  const [position, setPosition] = useState(initialPosition);
  const [viewState, setViewState] = useState({
    longitude: initialPosition.longitude,
    latitude: initialPosition.latitude,
    zoom: initialZoom,
  });

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
      .then((addressesInBounds) => {
        console.log("addressesInBounds", addressesInBounds);
        setAddressesInBounds(addressesInBounds);
      })
      .catch((e) => {
        throw e;
      });

    // getNearbyAddresses({ position })
    //   .then((nearbyAddressResults) => {
    //     console.log("nearbyAddresses", nearbyAddressResults);
    //     setAddresses(nearbyAddressResults);
    //   })
    //   .catch((e) => {
    //     throw e;
    //   });

    // getNearbyServiceLines({ position: restPosition })
    //   .then((serviceLines) => {
    //     console.log("serviceLines", serviceLines);
    //     setServiceLines(serviceLines);
    //   })
    //   .catch((e) => {
    //     throw e;
    //   });
    //
    // getNearbyOutageLines({ position: restPosition })
    //   .then((outageLines) => {
    //     console.log("outageLines", outageLines);
    //     setOutageLines(outageLines);
    //   })
    //   .catch((e) => {
    //     throw e;
    //   });
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

  // const handleMapLayerClick = useCallback(async (e: MapLayerMouseEvent) => {
  //   const feature = e.features?.[0];
  //   if (!feature || !mapRef.current) return;
  //
  //   const clusterId = feature.properties.cluster_id;
  //   const mapboxSource = mapRef.current.getSource("addresses");
  //
  //   // @ts-expect-error - getClusterExpansionZoo
  //   const zoom = await mapboxSource.getClusterExpansionZoom(clusterId);
  //
  //   mapRef.current.easeTo({
  //     center: feature.geometry,
  //     zoom,
  //     duration: 500,
  //   });
  // }, [mapRef]);

  const mapStyle = useMemo<StyleSpecification>(
    () => ({
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
    }),
    [],
  );

  const addressesGeoJsonData = useMemo<GeoJSON>(
    () => ({
      type: "FeatureCollection",
      features: addressesInBounds.map((address) => ({
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
    [addressesInBounds],
  );

  return (
    <Map
      {...viewState}
      ref={mapRef}
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
      <GeolocateControl />
      <NavigationControl />

      {addressesInBounds.length > 0 && (
        <Source
          id="addresses"
          type="geojson"
          data={addressesGeoJsonData}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
      )}

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
    }}
  />
);

const BluePin: FunctionComponent<{ mapZoom: number }> = ({ mapZoom }) => (
  <Circle
    sx={{
      fontSize: "10px",
      color: blue[400],
      opacity: 0.75,
    }}
  />
);
