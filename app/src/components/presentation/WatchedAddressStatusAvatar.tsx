import type { FunctionComponent } from "react";
import { Avatar, Box, CircularProgress } from "@mui/material";
import { Power, PowerOff, QuestionMark, Sync } from "@mui/icons-material";
import { green, grey, red, yellow } from "@mui/material/colors";
import type { PowerStatus } from "../../types/app";

type PowerStatusChipProps = {
  powerStatus: PowerStatus;
  loading: boolean;
};

export const WatchedAddressStatusAvatar: FunctionComponent<
  PowerStatusChipProps
> = ({ powerStatus, loading = false }) => {
  let icon;
  let avatarBgColor;
  if (loading) {
    icon = (
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sync sx={{ color: grey[500] }} />
        <CircularProgress sx={{ color: grey[500], position: "absolute" }} />
      </Box>
    );
    avatarBgColor = grey[100];
  } else {
    switch (powerStatus) {
      case "on": {
        icon = <Power sx={{ color: green[800] }} />;
        avatarBgColor = green[100];
        break;
      }
      case "off": {
        icon = <PowerOff sx={{ color: red[800] }} />;
        avatarBgColor = red[100];
        break;
      }
      case "indeterminate": {
        icon = <QuestionMark sx={{ color: yellow[800] }} />;
        avatarBgColor = yellow[100];
        break;
      }
    }
  }
  return (
    <Avatar
      sx={{ bgcolor: avatarBgColor }}
      aria-label={`Power is ${powerStatus}`}
    >
      {icon}
    </Avatar>
  );
};
