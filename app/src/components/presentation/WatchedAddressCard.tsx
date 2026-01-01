import {
  type FunctionComponent,
  type ReactElement,
  useCallback,
  useState,
} from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
} from "@mui/material";
import type { PowerStatus } from "../../types/app";
import { WatchedAddressStatusAvatar } from "./WatchedAddressStatusAvatar.tsx";
import { AddressFull } from "./AddressFull.tsx";
import { AddressMapPreview } from "../AddressMapPreview.tsx";
import type { Address } from "../../models/Address.ts";
import { PlaylistRemove, Sync } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import { DateFormatDistanceToNow } from "../util/DateFormatDistanceToNow.tsx";

type WatchedAddressCardProps = {
  address: Address;
  powerStatus: PowerStatus;
  synchronizing: boolean;
  lastSynchronizedAt: Date;
  onRequestSync?: () => void;
  onRequestDelete?: () => void;
};

type ActionName = "sync" | "remove";

const actions: Record<ActionName, { label: string; icon: ReactElement }> = {
  sync: {
    label: "Synchronize now",
    icon: <Sync />,
  },
  remove: {
    label: "Remove from list",
    icon: <PlaylistRemove />,
  },
};

export const WatchedAddressCard: FunctionComponent<WatchedAddressCardProps> = ({
  address,
  powerStatus,
  synchronizing = false,
  lastSynchronizedAt,
  onRequestSync,
  onRequestDelete,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpanded = useCallback(
    () => setExpanded(!expanded),
    [expanded],
  );

  const handleRequestDelete = useCallback(() => {
    if (onRequestDelete) {
      onRequestDelete();
    }
  }, [onRequestDelete]);
  const handleRequestSync = useCallback(() => {
    if (onRequestSync) {
      onRequestSync();
    }
  }, [onRequestSync]);

  let content;
  switch (powerStatus) {
    case "on":
      content = <PowerOnContent />;
      break;
    case "off":
      content = <PowerOffContent />;
      break;
    case "indeterminate":
      content = <PowerIndeterminateContent />;
      break;
  }

  return (
    <Card elevation={2}>
      <CardActionArea onClick={handleToggleExpanded}>
        <CardHeader
          title={address.address_line_1}
          subheader={`${address.city}, CO, ${address.zipcode}`}
          avatar={
            <WatchedAddressStatusAvatar
              powerStatus={powerStatus}
              synchronizing={synchronizing}
            />
          }
        >
          <AddressFull address={address} />
        </CardHeader>
      </CardActionArea>

      {expanded && (
        <>
          <CardMedia>
            <Box sx={{ aspectRatio: "2/1", height: "100%", width: "100%" }}>
              <AddressMapPreview address={address} height="100%" />
            </Box>
          </CardMedia>

          <CardContent>
            {content}
            <Typography variant="caption">
              Synchronized <DateFormatDistanceToNow from={lastSynchronizedAt} />
            </Typography>
          </CardContent>

          <CardActions>
            <Button
              size="small"
              startIcon={actions["remove"].icon}
              onClick={handleRequestDelete}
            >
              {actions["remove"].label}
            </Button>
            <Button
              size="small"
              startIcon={actions["sync"].icon}
              disabled={synchronizing}
              onClick={handleRequestSync}
            >
              {actions["sync"].label}
            </Button>
          </CardActions>
        </>
      )}
    </Card>
  );
};

const PowerOnContent: FunctionComponent = () => (
  <>
    <Typography variant="body1">Power is on.</Typography>
  </>
);

const PowerOffContent: FunctionComponent = () => (
  <>
    <Typography variant="body1">Power is off.</Typography>
  </>
);

const PowerIndeterminateContent: FunctionComponent = () => (
  <>
    <Typography variant="body1">Power status indeterminate.</Typography>
  </>
);
