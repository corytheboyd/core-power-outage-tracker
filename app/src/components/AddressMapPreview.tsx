import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FunctionComponent } from "react";

// Fix for default marker icon in bundled apps
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import L from "leaflet";
import type { Address } from "../models/Address.ts";
import { Typography } from "@mui/material";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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
      zoom={props.zoom ?? 14}
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
      <Marker position={position}>
        <Popup>
          <Typography>{props.address.address_line_1}</Typography>
        </Popup>
      </Marker>
    </MapContainer>
  );
};
