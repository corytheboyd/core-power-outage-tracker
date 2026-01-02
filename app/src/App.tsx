import { type FunctionComponent, useEffect } from "react";
import PWABadge from "./components/PWABadge.tsx";
import { ManagePage } from "./components/pages/ManagePage.tsx";
import { Box, CssBaseline } from "@mui/material";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useStore } from "./state/useStore.ts";
import { useDuckDb } from "./duckdb/useDuckDb.ts";
import { useCurrentPosition } from "./geolocation/useCurrentPosition.ts";

export const App: FunctionComponent = () => {
  const page = <ManagePage />;

  const duckdb = useDuckDb();

  const position = useCurrentPosition();

  useEffect(() => {
    if (!duckdb) return;
    if (!position) return;

    duckdb.connection
      .query(
        `
        SELECT 
          *,
          ST_Distance_Spheroid(
            ST_FlipCoordinates(geometry::POINT_2D), 
            ST_Point2D(${position.coords.latitude}, ${position.coords.longitude})
          ) AS distance
        FROM addresses_80421 
        ORDER BY distance ASC
        LIMIT 10
        `,
      )
      .then((r) => console.log(r.toArray().map((o) => o.toJSON())));
  }, [duckdb]);

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
