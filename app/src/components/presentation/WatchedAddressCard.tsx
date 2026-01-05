import {
  type FunctionComponent,
  type PropsWithChildren,
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
import { ServiceMap } from "../ServiceMap.tsx";
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
import {
  useStore,
  type WatchedAddress,
  type WatchedAddressWorkingCopy,
} from "../../state/useStore.ts";

export interface WatchedAddressCardOnRequestAddToListFunction {
  (): void;
}

export interface WatchedAddressCardOnRequestRemoveFromListFunction {
  (): void;
}

export interface WatchedAddressCardOnRequestSyncFunction {
  (): void;
}

type WatchedAddressCardCreateVariantProps = {
  variant: "create";
  watchedAddress: WatchedAddressWorkingCopy;
  onRequestAddToList?: WatchedAddressCardOnRequestAddToListFunction;
};

type WatchedAddressCardShowVariantProps = {
  variant: "show";
  watchedAddress: WatchedAddress;
  onRequestSync?: WatchedAddressCardOnRequestSyncFunction;
  onRequestRemoveFromList?: WatchedAddressCardOnRequestRemoveFromListFunction;
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
> = ({ watchedAddress, onRequestAddToList }) => {
  const [powerStatus, setPowerStatus] = useState<PowerStatus>("synchronizing");
  const updateNewWatchedAddress = useStore(
    (state) => state.watchedAddresses.updateWorkingCopy,
  );

  const handleRequestAddToList: WatchedAddressCardOnRequestAddToListFunction =
    useCallback(() => {
      if (onRequestAddToList) onRequestAddToList();
    }, [onRequestAddToList]);

  const handleAddressSearchInputOnSelect: AddressSearchInputOnSelectFunction =
    useCallback(
      (address) => {
        updateNewWatchedAddress({ address: address ?? undefined });
      },
      [updateNewWatchedAddress],
    );

  let title = "Add a new address";
  if (watchedAddress.address) {
    title = watchedAddress.address.address;
  }

  let subheader = "Search for an address to add to your watch list";
  if (watchedAddress.address) {
    subheader = `${watchedAddress.address.city}, CO, ${watchedAddress.address.zipcode}`;
  }

  let avatar = (
    <Avatar sx={{ bgcolor: blue[100] }}>
      <AddLocationAlt sx={{ color: blue[800] }} />
    </Avatar>
  );
  if (watchedAddress.address) {
    avatar = <WatchedAddressStatusAvatar powerStatus={powerStatus} />;
  }

  return (
    <Card elevation={2}>
      <CardHeader title={title} subheader={subheader} avatar={avatar} />

      <CardMedia>
        <CardMediaContent>
          <ServiceMap
            address={watchedAddress?.address}
            initialPosition={watchedAddress.mapPosition}
            initialZoom={watchedAddress.mapZoom}
          />
        </CardMediaContent>
      </CardMedia>

      <CardContent>
        <AddressSearchInput onSelect={handleAddressSearchInputOnSelect} />
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={actions["addToList"].icon}
          onClick={handleRequestAddToList}
          disabled={watchedAddress.address == null}
        >
          {actions["addToList"].label}
        </Button>
      </CardActions>
    </Card>
  );
};

const WatchedAddressCardShowVariant: FunctionComponent<
  WatchedAddressCardShowVariantProps
> = ({ watchedAddress, onRequestSync, onRequestRemoveFromList }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpanded = useCallback(
    () => setExpanded(!expanded),
    [expanded],
  );

  const handleRequestDelete = useCallback(() => {
    if (onRequestRemoveFromList) {
      onRequestRemoveFromList();
    }
  }, [onRequestRemoveFromList]);
  const handleRequestSync = useCallback(() => {
    if (onRequestSync) {
      onRequestSync();
    }
  }, [onRequestSync]);

  const address = watchedAddress.address;
  const powerStatus = watchedAddress.powerStatus;
  const lastSynchronizedAt = watchedAddress.lastSynchronizedAt;

  const cardHeader = (
    <CardHeader
      title={address.address}
      subheader={`${address.city}, CO, ${address.zipcode}`}
      avatar={<WatchedAddressStatusAvatar powerStatus={powerStatus} />}
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
            <CardMediaContent>
              <ServiceMap
                address={address}
                initialPosition={{
                  latitude: address.latitude,
                  longitude: address.longitude,
                }}
                initialZoom={watchedAddress.mapZoom}
              />
            </CardMediaContent>
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

const CardMediaContent: FunctionComponent<PropsWithChildren> = ({
  children,
}) => <Box sx={{ aspectRatio: "3/1", width: "100%" }}>{children}</Box>;

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
