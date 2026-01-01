import type { FunctionComponent } from "react";
import { Chip } from "@mui/material";
import { Bolt } from "@mui/icons-material";

type PowerStatusChipProps = {
  state: "on" | "off" | "unknown";
};

export const PowerStatusChip: FunctionComponent<PowerStatusChipProps> = ({
  state,
}) => {
  const chipProps = {
    sx: { width: "100%" },
  };
  switch (state) {
    case "on": {
      return (
        <Chip {...chipProps} icon={<Bolt />} label="Power On" color="success" />
      );
    }
    case "off": {
      return (
        <Chip {...chipProps} icon={<Bolt />} label="Power Off" color="error" />
      );
    }
    case "unknown": {
      return (
        <Chip
          {...chipProps}
          icon={<Bolt />}
          label="Power Maybe Off"
          color="warning"
        />
      );
    }
  }
};
