import { type FunctionComponent } from "react";
import { Paper } from "@mui/material";
import { NewWatchedAddressForm } from "../NewWatchedAddressForm.tsx";

export const ManagePage: FunctionComponent = () => {
  return (
    <Paper elevation={0} sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <NewWatchedAddressForm />
    </Paper>
  );
};
