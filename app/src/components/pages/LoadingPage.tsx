import type { FunctionComponent } from "react";
import { LinearProgress } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

export const LoadingPage: FunctionComponent<{
  status: string;
  progress: number;
}> = ({ status, progress }) => {
  return (
    <Grid
      container
      sx={{ px: 2, mt: 20 }}
      spacing={2}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Grid size={12}>
        <LinearProgress value={progress} />
      </Grid>
      <Grid>
        <Typography>{status}</Typography>
      </Grid>
    </Grid>
  );
};
