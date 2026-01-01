import type { FunctionComponent } from "react";
import Grid from "@mui/material/Grid";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Typography from "@mui/material/Typography";
import { formatDistance } from "../../lib/formatDistance.ts";
import type { Address } from "../../models/Address.ts";

type AddressLinesProps = {
  address: Address;
  distance?: number;
};

export const AddressFull: FunctionComponent<AddressLinesProps> = ({
  address,
  distance,
}) => {
  return (
    <Grid container sx={{ alignItems: "center" }}>
      <Grid sx={{ display: "flex", width: 44 }}>
        <LocationOnIcon sx={{ color: "text.secondary" }} />
      </Grid>
      <Grid>
        <Typography variant="body1">{address.address_line_1}</Typography>
        {address.address_line_2.length > 0 && (
          <Typography>{address.address_line_2}</Typography>
        )}
        <Typography variant="body2">
          {address.city}, CO, {address.zipcode}
        </Typography>
        {distance && (
          <Typography variant="caption">{formatDistance(distance)}</Typography>
        )}
      </Grid>
    </Grid>
  );
};
