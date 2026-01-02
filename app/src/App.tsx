import { type FunctionComponent } from "react";
import PWABadge from "./components/PWABadge.tsx";
import { ManagePage } from "./components/pages/ManagePage.tsx";
import { Box, CssBaseline } from "@mui/material";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

export const App: FunctionComponent = () => {
  const page = <ManagePage />;

  return (
    <>
      <CssBaseline />
      <Grid
        container
        direction="column"
        alignItems="center"
        sx={{ minHeight: "100vh" }}
      >
        <Grid component="main" flexGrow={1} sx={{ width: "100%" }}>
          <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>{page}</Box>
        </Grid>
        <Grid
          container
          component="footer"
          justifyContent="center"
          alignItems="center"
          sx={{ width: "100%", py: 2 }}
        >
          <Typography variant="overline">Cory Boyd • 2025</Typography>
        </Grid>
      </Grid>
      <PWABadge />
    </>
  );
};
