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
import type { AddressSearchResult, PowerStatus } from "../../types/app";
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
import {
  AddressSearchInput,
  type AddressSearchInputOnSelectFunction,
} from "../AddressSearchInput.tsx";

type WatchedAddressCardCreateVariantProps = {
  variant: "create";
  onRequestAddToList?: () => void;
};

type WatchedAddressCardShowVariantProps = {
  variant: "show";
  address: Address;
  powerStatus: PowerStatus;
  lastSynchronizedAt: Date;
  onRequestSync?: () => void;
  onRequestDelete?: () => void;
};

type WatchedAddressCardProps =
  | WatchedAddressCardCreateVariantProps
  | WatchedAddressCardShowVariantProps;

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
    label: "Add to list",
    icon: <PlaylistAdd />,
  },
};

export const WatchedAddressCard: FunctionComponent<WatchedAddressCardProps> = (
  props,
) => {
  if (props.variant === "create") {
    return <WatchedAddressCardCreateVariant {...props} />;
  } else {
    return <WatchedAddressCardShowVariant {...props} />;
  }
};

const WatchedAddressCardCreateVariant: FunctionComponent<
  WatchedAddressCardCreateVariantProps
> = ({ onRequestAddToList }) => {
  const [selection, setSelection] = useState<AddressSearchResult | null>(null);

  const handleAddressSearchInputOnSelect: AddressSearchInputOnSelectFunction =
    useCallback((result) => {
      console.log(result);
      setSelection(result);
    }, []);

  const handleRequestAddToList = useCallback(() => {
    if (onRequestAddToList) {
      onRequestAddToList();
    }
  }, [onRequestAddToList]);

  return (
    <Card elevation={2}>
      <CardHeader
        title="Add a new address"
        subheader="Search for an address to add to your watch list"
        avatar={
          <Avatar sx={{ bgcolor: blue[100] }}>
            <AddLocationAlt sx={{ color: blue[800] }} />
          </Avatar>
        }
      />

      {selection && (
        <CardMedia>
          <CardMediaContent address={selection.address} />
        </CardMedia>
      )}

      <CardContent>
        <AddressSearchInput onSelect={handleAddressSearchInputOnSelect} />
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={actions["addToList"].icon}
          onClick={handleRequestAddToList}
          disabled={selection == null}
        >
          {actions["addToList"].label}
        </Button>
      </CardActions>
    </Card>
  );
};

const WatchedAddressCardShowVariant: FunctionComponent<
  WatchedAddressCardShowVariantProps
> = ({
  address,
  powerStatus,
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

  const cardHeaderAvatar = (
    <WatchedAddressStatusAvatar powerStatus={powerStatus} />
  );

  const cardHeader = (
    <CardHeader
      title={address.address}
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

  const cardActions = (
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
        disabled={powerStatus === "synchronizing"}
        onClick={handleRequestSync}
      >
        {actions["synchronize"].label}
      </Button>
    </>
  );

  return (
    <Card elevation={2}>
      <CardActionArea onClick={handleToggleExpanded}>
        {cardHeader}
      </CardActionArea>

      {expanded && (
        <>
          <CardMedia>
            <CardMediaContent address={address} />
          </CardMedia>

          <CardContent>
            {cardContent}
            {powerStatus !== "synchronizing" && lastSynchronizedAt && (
              <Typography variant="caption">
                Synchronized{" "}
                <DateFormatDistanceToNow from={lastSynchronizedAt} />
              </Typography>
            )}
          </CardContent>

          <CardActions>{cardActions}</CardActions>
        </>
      )}
    </Card>
  );
};

const CardMediaContent: FunctionComponent<{ address: Address }> = ({
  address,
}) => (
  <Box sx={{ aspectRatio: "3/1", width: "100%" }}>
    <AddressMapPreview address={address} />
  </Box>
);

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
