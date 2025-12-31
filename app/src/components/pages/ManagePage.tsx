import { type FunctionComponent, useEffect, useState } from "react";
import { Box, Chip, IconButton, List, ListItem, ListItemText, Paper, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useStore } from "../../state/useStore.ts";
import { formatDistance } from "../../lib/formatDistance.ts";
import { useDuckDbQuery } from "../../duckdb/useDuckDbQuery.ts";
import { closestOutageQueryFunction } from "../../duckdb/queryFunctions/closestOutageQueryFunction.ts";
import { AddressSearchInput } from "../AddressSearchInput.tsx";

type OutageStatus = {
  distance: number | null;
  loading: boolean;
};

export const ManagePage: FunctionComponent = () => {
  const { addresses, addAddress, removeAddress } = useStore(
    (state) => state.watchedAddresses,
  );

  const [outageStatuses, setOutageStatuses] = useState<
    Map<number, OutageStatus>
  >(new Map());
  const nearestOutage = useDuckDbQuery(closestOutageQueryFunction);

  useEffect(() => {
    if (!nearestOutage) {
      return;
    }

    const fetchOutageStatuses = async () => {
      const newStatuses = new Map<number, OutageStatus>();

      for (const watched of addresses) {
        newStatuses.set(watched.address.id, {
          distance: null,
          loading: true,
        });
      }
      setOutageStatuses(newStatuses);

      for (const watched of addresses) {
        try {
          const distance = (
            await nearestOutage({
              addressId: watched.address.id,
            })
          ).first();
          setOutageStatuses((prev) => {
            const updated = new Map(prev);
            updated.set(watched.address.id, { distance, loading: false });
            return updated;
          });
        } catch (error) {
          console.error(
            `Failed to fetch outage status for address ${watched.address.id}:`,
            error,
          );
          setOutageStatuses((prev) => {
            const updated = new Map(prev);
            updated.set(watched.address.id, {
              distance: null,
              loading: false,
            });
            return updated;
          });
        }
      }
    };

    if (addresses.length > 0) {
      fetchOutageStatuses();
    } else {
      setOutageStatuses(new Map());
    }
  }, [addresses]);

  // const handleAddressSearchInputChange = useCallback(
  //   (result: AddressSearchResult) => {
  //     addAddress(result.address);
  //   },
  //   [],
  // );

  const getOutageIndicator = (addressId: number) => {
    const status = outageStatuses.get(addressId);

    if (!status || status.loading) {
      return <Chip size="small" label="Checking..." />;
    }

    if (status.distance === null) {
      return <Chip size="small" label="Unknown" color="default" />;
    }

    const OUTAGE_THRESHOLD_METERS = 100;
    const hasOutage = status.distance <= OUTAGE_THRESHOLD_METERS;

    if (hasOutage) {
      return (
        <Chip
          size="small"
          icon={<WarningIcon />}
          label={`Outage ${formatDistance(status.distance)}`}
          color="error"
        />
      );
    }

    return (
      <Chip
        size="small"
        icon={<CheckCircleIcon />}
        label={`No outage (${formatDistance(status.distance)})`}
        color="success"
      />
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Manage Watched Addresses
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New Address
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <AddressSearchInput />
          </Box>
          {/*<Button*/}
          {/*  variant="contained"*/}
          {/*  onClick={handleAddressSearchInputChange}*/}
          {/*  disabled={!activeSearchResult}*/}
          {/*  sx={{ mt: 1 }}*/}
          {/*>*/}
          {/*  Add*/}
          {/*</Button>*/}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Watched Addresses ({addresses.length})
        </Typography>
        {addresses.length === 0 ? (
          <Typography color="text.secondary">
            No addresses being watched. Add one above to get started.
          </Typography>
        ) : (
          <List>
            {addresses.map((watched) => (
              <ListItem
                key={watched.address.id}
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {getOutageIndicator(watched.address.id)}
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removeAddress(watched.address.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`${watched.address.address_line_1}${watched.address.address_line_2 ? " " + watched.address.address_line_2 : ""}`}
                  secondary={`${watched.address.city}, CO ${watched.address.zipcode}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
