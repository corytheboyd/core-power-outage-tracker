import "leaflet/dist/leaflet.css";
import type { FunctionComponent } from "react";
import type { Address } from "../models/Address.ts";
import { layers, namedFlavor } from "@protomaps/basemaps";
import Map, { Marker } from "react-map-gl/maplibre";
import { LocationPin } from "@mui/icons-material";
import { red } from "@mui/material/colors";

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
      <Marker
        longitude={address.longitude}
        latitude={address.latitude}
        anchor="bottom"
      >
        <LocationPin
          fontSize="large"
          sx={{
            color: red[700],
            filter: "drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.35))",
          }}
        />
      </Marker>
    </Map>
  );
};
