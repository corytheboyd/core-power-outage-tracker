import { type FunctionComponent } from "react";
import PWABadge from "./components/PWABadge.tsx";
import { ManagePage } from "./components/pages/ManagePage.tsx";
import { Box } from "@mui/material";

export const App: FunctionComponent = () => {
  return (
    <>
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <ManagePage />
      </Box>
      <PWABadge />
    </>
  );
};
