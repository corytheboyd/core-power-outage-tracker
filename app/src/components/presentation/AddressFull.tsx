import type { FunctionComponent } from "react";
import Grid from "@mui/material/Grid";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Typography from "@mui/material/Typography";
import type { Address } from "../../models/Address.ts";

type AddressLinesProps = {
  address: Address;
};

export const AddressFull: FunctionComponent<AddressLinesProps> = ({
  address,
}) => {
  return (
    <Grid container sx={{ alignItems: "center" }}>
      <Grid sx={{ display: "flex", width: 44 }}>
        <LocationOnIcon sx={{ color: "text.secondary" }} />
      </Grid>
      <Grid>
        <Typography variant="body1">{address.address}</Typography>
        <Typography variant="body2">
          {address.city}, CO, {address.zipcode}
        </Typography>
      </Grid>
    </Grid>
  );
};
