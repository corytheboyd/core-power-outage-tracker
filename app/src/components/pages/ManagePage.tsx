import type { FunctionComponent } from "react";
import { Box, Button, List, ListItem, ListItemText, IconButton, Typography, Paper } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddressSearchInput from "../AddressSearchInput.tsx";
import { useStore } from "../../state/useStore.ts";

export const ManagePage: FunctionComponent = () => {
  const { activeSearchResult, setActiveSearchResult } = useStore(
    (state) => state.addressSearch
  );
  const { addresses, addAddress, removeAddress } = useStore(
    (state) => state.watchedAddresses
  );

  const handleAddAddress = () => {
    if (activeSearchResult) {
      addAddress(activeSearchResult.address);
      setActiveSearchResult(null);
    }
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
          <Button
            variant="contained"
            onClick={handleAddAddress}
            disabled={!activeSearchResult}
            sx={{ mt: 1 }}
          >
            Add
          </Button>
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
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removeAddress(watched.address.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
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
