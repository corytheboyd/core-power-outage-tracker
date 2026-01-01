import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FunctionComponent } from "react";
import type { Address } from "../models/Address.ts";
import { Typography } from "@mui/material";

interface MapDemoProps {
  address: Address;
  zoom?: number;
  height?: string | number;
}

export const AddressMapPreview: FunctionComponent<MapDemoProps> = (props) => {
  const position: [number, number] = [
    props.address.latitude,
    props.address.longitude,
  ];
  const height =
    typeof props.height === "number"
      ? `${props.height}px`
      : props.height || "400px";

  return (
    <MapContainer
      key={props.address.id}
      center={position}
      zoom={props.zoom ?? 15}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      style={{ height, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/*{powerLines.map((line) => (*/}
      {/*  <Polyline*/}
      {/*    key={line.id}*/}
      {/*    positions={line.geometry}*/}
      {/*    pathOptions={{*/}
      {/*      color: "blue",*/}
      {/*      weight: 3,*/}
      {/*      opacity: 0.7,*/}
      {/*    }}*/}
      {/*  />*/}
      {/*))}*/}

      <Marker position={position}>
        <Popup>
          <Typography>{props.address.address_line_1}</Typography>
        </Popup>
      </Marker>
    </MapContainer>
  );
};
