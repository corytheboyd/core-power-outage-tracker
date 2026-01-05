import { type FunctionComponent, useCallback } from "react";
import { WatchedAddressCard } from "../presentation/WatchedAddressCard.tsx";
import { useStore } from "../../state/useStore.ts";
import { MapProvider } from "react-map-gl/maplibre";
import { Box, Stack } from "@mui/material";

export const ManagePage: FunctionComponent = () => {
  const workingCopy = useStore((state) => state.watchedAddresses.workingCopy);
  const entries = useStore((state) => state.watchedAddresses.entries);
  const commit = useStore((state) => state.watchedAddresses.commitWorkingCopy);

  const handleAddToList = useCallback(() => {
    commit();
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <MapProvider>
        <Stack spacing={2}>
          {Object.values(entries).map((watchedAddress) => (
            <WatchedAddressCard
              key={watchedAddress.address.id}
              variant="show"
              watchedAddress={watchedAddress}
            />
          ))}

          <WatchedAddressCard
            variant="create"
            watchedAddress={workingCopy}
            onRequestAddToList={handleAddToList}
          />
        </Stack>
      </MapProvider>
    </Box>
  );
};
