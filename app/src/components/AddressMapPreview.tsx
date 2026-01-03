import "leaflet/dist/leaflet.css";
import type { FunctionComponent } from "react";
import type { Address } from "../models/Address.ts";
import { layers, namedFlavor } from "@protomaps/basemaps";
import Map from "react-map-gl/maplibre";

interface MapDemoProps {
  address: Address;
  zoom?: number;
}

export const AddressMapPreview: FunctionComponent<MapDemoProps> = ({
  address,
  zoom = 15,
}) => {
  return (
    <Map
      longitude={address.longitude}
      latitude={address.latitude}
      zoom={zoom}
      minZoom={13}
      maxZoom={15}
      style={{ width: "100%", height: 400 }}
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
    />
  );
};
