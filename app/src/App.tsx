import { type FunctionComponent, useEffect } from "react";
import PWABadge from "./components/PWABadge.tsx";
import { ManagePage } from "./components/pages/ManagePage.tsx";
import { Box, CssBaseline } from "@mui/material";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useStore } from "./state/useStore.ts";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { addProtocol, removeProtocol } from "maplibre-gl";
import { synchronizeAddressesTable } from "./duckdb/operations/synchronizeAddressesTable.ts";
import { synchronizeServiceLinesTable } from "./duckdb/operations/synchronizeServiceLinesTable.ts";

export const App: FunctionComponent = () => {
  const page = <ManagePage />;

  useEffect(() => {
    const protocol = new Protocol();
    addProtocol("pmtiles", protocol.tile);
    return () => {
      removeProtocol("pmtiles");
    };
  }, []);

  useEffect(() => {
    synchronizeAddressesTable()
      .then(() => console.debug("addresses table synchronized"))
      .catch((e) => {
        throw e;
      });
    synchronizeServiceLinesTable()
      .then(() => console.debug("service_lines table synchronized"))
      .catch((e) => {
        throw e;
      });
  }, []);

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
      <hr />
      <pre>
        <code>{JSON.stringify(useStore.getState(), null, 2)}</code>
      </pre>
    </>
  );
};
