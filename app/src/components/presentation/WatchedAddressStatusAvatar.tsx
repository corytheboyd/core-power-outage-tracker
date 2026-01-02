import type { FunctionComponent } from "react";
import { Avatar, Box, CircularProgress } from "@mui/material";
import { Power, PowerOff, QuestionMark, Sync } from "@mui/icons-material";
import { green, grey, red, yellow } from "@mui/material/colors";
import type { PowerStatus } from "../../types/app";

export const WatchedAddressStatusAvatar: FunctionComponent<{
  powerStatus: PowerStatus;
}> = ({ powerStatus }) => {
  let icon;
  let avatarBgColor;
  switch (powerStatus) {
    case "synchronizing": {
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
      break;
    }
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
    case "unknown": {
      icon = <QuestionMark sx={{ color: yellow[800] }} />;
      avatarBgColor = yellow[100];
      break;
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
