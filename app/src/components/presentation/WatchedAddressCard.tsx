import {
  type FunctionComponent,
  type ReactElement,
  useCallback,
  useState,
} from "react";
import {
  Avatar,
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
import {
  AddLocationAlt,
  PlaylistAdd,
  PlaylistRemove,
  Sync,
} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import { DateFormatDistanceToNow } from "./DateFormatDistanceToNow.tsx";
import { blue } from "@mui/material/colors";

type WatchedAddressCardProps = {
  address: Address;
  powerStatus: PowerStatus;
  variant: "create" | "show";
  lastSynchronizedAt?: Date;
  expandable?: boolean;
  onRequestAddToList?: () => void;
  onRequestSync?: () => void;
  onRequestDelete?: () => void;
};

type ActionName = "synchronize" | "removeFromList" | "addToList";

const actions: Record<ActionName, { label: string; icon: ReactElement }> = {
  synchronize: {
    label: "Synchronize now",
    icon: <Sync />,
  },
  removeFromList: {
    label: "Remove from list",
    icon: <PlaylistRemove />,
  },
  addToList: {
    label: "Save to list",
    icon: <PlaylistAdd />,
  },
};

export const WatchedAddressCard: FunctionComponent<WatchedAddressCardProps> = ({
  address,
  powerStatus,
  variant,
  lastSynchronizedAt,
  onRequestAddToList,
  onRequestSync,
  onRequestDelete,
}) => {
  const [expanded, setExpanded] = useState(variant == "create");

  const handleToggleExpanded = useCallback(
    () => setExpanded(!expanded),
    [expanded],
  );

  const handleRequestAddToList = useCallback(() => {
    if (onRequestAddToList) {
      onRequestAddToList();
    }
  }, [onRequestAddToList]);
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

  let cardHeaderAvatar: ReactElement;
  if (variant == "create") {
    cardHeaderAvatar = (
      <Avatar sx={{ bgcolor: blue[100] }}>
        <AddLocationAlt sx={{ color: blue[800] }} />
      </Avatar>
    );
  } else {
    cardHeaderAvatar = <WatchedAddressStatusAvatar powerStatus={powerStatus} />;
  }

  const cardHeader = (
    <CardHeader
      title={address.address_line_1}
      subheader={`${address.city}, CO, ${address.zipcode}`}
      avatar={cardHeaderAvatar}
    >
      <AddressFull address={address} />
    </CardHeader>
  );

  let cardContent: ReactElement;
  switch (powerStatus) {
    case "on":
      cardContent = <PowerStatusOnContent />;
      break;
    case "off":
      cardContent = <PowerStatusOffContent />;
      break;
    case "unknown":
      cardContent = <PowerStatusUnknownContent />;
      break;
    case "synchronizing": {
      cardContent = <PowerStatusSynchronizingContent />;
      break;
    }
  }

  let cardActions: ReactElement;
  if (variant == "show") {
    cardActions = (
      <>
        <Button
          size="small"
          startIcon={actions["removeFromList"].icon}
          onClick={handleRequestDelete}
        >
          {actions["removeFromList"].label}
        </Button>
        <Button
          size="small"
          startIcon={actions["synchronize"].icon}
          disabled={powerStatus == "synchronizing"}
          onClick={handleRequestSync}
        >
          {actions["synchronize"].label}
        </Button>
      </>
    );
  } else {
    cardActions = (
      <>
        <Button
          size="small"
          startIcon={actions["addToList"].icon}
          onClick={handleRequestAddToList}
        >
          {actions["addToList"].label}
        </Button>
        <Button
          size="small"
          startIcon={actions["synchronize"].icon}
          disabled={powerStatus == "synchronizing"}
          onClick={handleRequestSync}
        >
          {actions["synchronize"].label}
        </Button>
      </>
    );
  }

  const expandable = variant == "show";
  const showContent = variant == "show" && expanded;

  return (
    <Card elevation={2}>
      {expandable && (
        <CardActionArea onClick={handleToggleExpanded}>
          {cardHeader}
        </CardActionArea>
      )}
      {!expandable && cardHeader}

      {expanded && (
        <>
          <CardMedia>
            <Box sx={{ aspectRatio: "2/1", height: "100%", width: "100%" }}>
              <AddressMapPreview address={address} height="100%" />
            </Box>
          </CardMedia>

          {showContent && (
            <CardContent>
              {cardContent}
              {powerStatus != "synchronizing" && lastSynchronizedAt && (
                <Typography variant="caption">
                  Synchronized{" "}
                  <DateFormatDistanceToNow from={lastSynchronizedAt} />
                </Typography>
              )}
            </CardContent>
          )}

          <CardActions>{cardActions}</CardActions>
        </>
      )}
    </Card>
  );
};

const PowerStatusSynchronizingContent: FunctionComponent = () => (
  <>
    <Typography variant="body1">Synchronizing...</Typography>
  </>
);

const PowerStatusOnContent: FunctionComponent = () => (
  <>
    <Typography variant="body1">Power is on.</Typography>
  </>
);

const PowerStatusOffContent: FunctionComponent = () => (
  <>
    <Typography variant="body1">Power is off.</Typography>
  </>
);

const PowerStatusUnknownContent: FunctionComponent = () => (
  <>
    <Typography variant="body1">Power status unknown.</Typography>
  </>
);
