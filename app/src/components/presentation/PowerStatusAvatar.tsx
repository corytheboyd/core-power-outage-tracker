import type { FunctionComponent } from "react";
import { Avatar } from "@mui/material";
import { Bolt } from "@mui/icons-material";
import { green } from "@mui/material/colors";

type PowerStatusChipProps = {
  state: "on" | "off" | "unknown";
};

export const PowerStatusAvatar: FunctionComponent<PowerStatusChipProps> = ({
  state,
}) => {
  let icon;
  let avatarBgColor;
  switch (state) {
    case "on": {
      icon = <Bolt sx={{ color: green[500] }} />;
      avatarBgColor = green[100];
      break;
    }
    case "off": {
      icon = <Bolt />;
      avatarBgColor = green[100];
      break;
    }
    case "unknown": {
      icon = <Bolt />;
      avatarBgColor = green[100];
      break;
    }
  }
  return <Avatar sx={{ bgcolor: avatarBgColor }}>{icon}</Avatar>;
};
