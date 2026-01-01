import type { FunctionComponent } from "react";
import type { Address } from "../models/Address.ts";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
} from "@mui/material";
import { Place } from "@mui/icons-material";
import { AddressFull } from "./presentation/AddressFull.tsx";
import { AddressMapPreview } from "./AddressMapPreview.tsx";
import { PowerStatusChip } from "./presentation/PowerStatusChip.tsx";
import { blue } from "@mui/material/colors";

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
        avatar={
          <Avatar sx={{ bgcolor: blue[100] }}>
            <Place sx={{ color: blue[500] }} fontSize="medium" />
          </Avatar>
        }
      >
        <AddressFull address={address} />
      </CardHeader>
      <CardMedia>
        <Box sx={{ aspectRatio: "1.5/1", height: "100%", width: "100%" }}>
          <AddressMapPreview address={address} height="100%" />
        </Box>
      </CardMedia>
      <CardContent>
        <PowerStatusChip state="on" />
      </CardContent>
    </Card>
  );
};
