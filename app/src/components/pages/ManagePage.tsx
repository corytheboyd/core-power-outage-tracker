import { type FunctionComponent } from "react";
import { Box, Paper } from "@mui/material";
import { NewWatchedAddressForm } from "../NewWatchedAddressForm.tsx";

export const ManagePage: FunctionComponent = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <NewWatchedAddressForm />
      </Paper>
    </Box>
  );
};
