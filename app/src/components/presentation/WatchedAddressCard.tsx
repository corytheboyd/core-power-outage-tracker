import { type FunctionComponent, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardMedia,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
} from "@mui/material";
import type { PowerStatus } from "../../types/app";
import { WatchedAddressStatusAvatar } from "./WatchedAddressStatusAvatar.tsx";
import { AddressFull } from "./AddressFull.tsx";
import { AddressMapPreview } from "../AddressMapPreview.tsx";
import type { Address } from "../../models/Address.ts";
import { MoreVert, PlaylistRemove, Sync } from "@mui/icons-material";

type WatchedAddressCardProps = {
  address: Address;
  powerStatus: PowerStatus;
  loading: boolean;
};

export const WatchedAddressCard: FunctionComponent<WatchedAddressCardProps> = ({
  address,
  powerStatus,
  loading = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Card elevation={2}>
        <CardHeader
          title={address.address_line_1}
          subheader={`${address.city}, CO, ${address.zipcode}`}
          avatar={
            <WatchedAddressStatusAvatar
              powerStatus={powerStatus}
              loading={loading}
            />
          }
          action={
            <IconButton
              aria-label="settings"
              id="basic-button"
              aria-controls={open ? "card-header-action-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleClick}
            >
              <MoreVert />
            </IconButton>
          }
        >
          <AddressFull address={address} />
        </CardHeader>
        <CardMedia>
          <Box sx={{ aspectRatio: "2/1", height: "100%", width: "100%" }}>
            <AddressMapPreview address={address} height="100%" />
          </Box>
        </CardMedia>
      </Card>
      {/* CARD HEADER ACTION MENU */}
      <Menu
        id="card-header-action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuList dense sx={{ width: 200 }}>
          <MenuItem>
            <ListItemIcon>
              <PlaylistRemove fontSize="small" />
            </ListItemIcon>
            <ListItemText>Remove from list</ListItemText>
          </MenuItem>
          <MenuItem disabled={loading}>
            <ListItemIcon>
              <Sync fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sync now</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};
