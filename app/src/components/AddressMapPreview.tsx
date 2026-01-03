import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FunctionComponent } from "react";
import type { Address } from "../models/Address.ts";

interface MapDemoProps {
  address: Address;
  zoom?: number;
}

export const AddressMapPreview: FunctionComponent<MapDemoProps> = ({
  address,
  zoom = 15,
}) => {
  const position: [number, number] = [address.latitude, address.longitude];

  return (
    <MapContainer
      key={address.id}
      center={position}
      zoom={zoom}
      zoomControl={true}
      scrollWheelZoom={false}
      dragging={true}
      doubleClickZoom={false}
      touchZoom={false}
      style={{ height: "100%", width: "100%" }}
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

      <Marker position={position} />
    </MapContainer>
  );
};
