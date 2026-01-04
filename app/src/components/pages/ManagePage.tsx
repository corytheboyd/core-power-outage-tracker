import { type FunctionComponent } from "react";
import { WatchedAddressCard } from "../presentation/WatchedAddressCard.tsx";
import { useStore } from "../../state/useStore.ts";

export const ManagePage: FunctionComponent = () => {
  const newWatchedAddress = useStore((state) => state.watchedAddresses.new);
  // const watchedAddresses = useStore((state) =>
  //   Object.values(state.watchedAddresses.entries),
  // );

  return (
    <>
      <WatchedAddressCard variant="create" watchedAddress={newWatchedAddress} />
      {/*{watchedAddresses.map((watchedAddress) => (*/}
      {/*  <WatchedAddressCard variant="show" watchedAddress={watchedAddress} />*/}
      {/*))}*/}
    </>
  );
};
