import { type FunctionComponent, type ReactElement } from "react";
import PWABadge from "./components/PWABadge.tsx";
import { CssBaseline } from "@mui/material";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import "maplibre-gl/dist/maplibre-gl.css";
import { LoadingPage } from "./components/pages/LoadingPage.tsx";
import { useAppInitialize } from "./useAppInitialize.ts";
import { ManagePage } from "./components/pages/ManagePage.tsx";

export const App: FunctionComponent = () => {
  const { loading, status, progress } = useAppInitialize();

  let page: ReactElement;
  if (loading) {
    page = <LoadingPage status={status} progress={progress} />;
  } else {
    page = <ManagePage />;
  }

  return (
    <>
      <CssBaseline />
      <Grid
        container
        direction="column"
        alignItems="center"
        sx={{ minHeight: "100vh" }}
      >
        <Grid
          component="main"
          flexGrow={1}
          sx={{ maxWidth: 800, width: "100%" }}
        >
          {page}
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
