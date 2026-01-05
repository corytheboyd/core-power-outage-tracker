import { type FunctionComponent } from "react";
import { WatchedAddressCard } from "../presentation/WatchedAddressCard.tsx";
import { useStore } from "../../state/useStore.ts";
import { MapProvider } from "react-map-gl/maplibre";

export const ManagePage: FunctionComponent = () => {
  const newWatchedAddress = useStore((state) => state.watchedAddresses.new);
  const watchedAddressEntries = useStore(
    (state) => state.watchedAddresses.entries,
  );

  return (
    <>
      <MapProvider>
        <WatchedAddressCard
          variant="create"
          watchedAddress={newWatchedAddress}
        />
        {Object.values(watchedAddressEntries).map((watchedAddress) => (
          <WatchedAddressCard variant="show" watchedAddress={watchedAddress} />
        ))}
      </MapProvider>
    </>
  );
};
