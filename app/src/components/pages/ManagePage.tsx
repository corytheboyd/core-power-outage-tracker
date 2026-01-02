import { type FunctionComponent } from "react";
import { WatchedAddressCard } from "../presentation/WatchedAddressCard.tsx";

export const ManagePage: FunctionComponent = () => {
  return (
    <>
      <WatchedAddressCard variant="create" />
    </>
  );
};
