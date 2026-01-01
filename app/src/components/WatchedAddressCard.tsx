import type { FunctionComponent } from "react";
import type { Address } from "../models/Address.ts";
import { Box, Card, CardHeader, CardMedia } from "@mui/material";
import { AddressFull } from "./presentation/AddressFull.tsx";
import { AddressMapPreview } from "./AddressMapPreview.tsx";
import { PowerStatusAvatar } from "./presentation/PowerStatusAvatar.tsx";

type WatchedAddressCardProps = {
  address: Address;
};

export const WatchedAddressCard: FunctionComponent<WatchedAddressCardProps> = ({
  address,
}) => {
  return (
    <Card>
      <CardHeader
        title={address.address_line_1}
        subheader={`${address.city}, CO, ${address.zipcode}`}
        avatar={<PowerStatusAvatar state="on" />}
      >
        <AddressFull address={address} />
      </CardHeader>
      <CardMedia>
        <Box sx={{ aspectRatio: "2/1", height: "100%", width: "100%" }}>
          <AddressMapPreview address={address} height="100%" />
        </Box>
      </CardMedia>
    </Card>
  );
};
