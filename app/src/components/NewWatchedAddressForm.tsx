import { type FunctionComponent, useCallback, useState } from "react";
import { Stack } from "@mui/material";
import {
  AddressSearchInput,
  type AddressSearchInputOnSelectFunction,
} from "./AddressSearchInput.tsx";
import type { Address } from "../models/Address.ts";
import { WatchedAddressCard } from "./presentation/WatchedAddressCard.tsx";
import { sub } from "date-fns/sub";

export const NewWatchedAddressForm: FunctionComponent = () => {
  const [address, setAddress] = useState<Address | null>();

  const handleAddressSearchInputSelect =
    useCallback<AddressSearchInputOnSelectFunction>((result) => {
      if (result != null) {
        setAddress(result.address);
      } else {
        setAddress(null);
      }
    }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log(e);
      }}
    >
      <Stack spacing={2}>
        <AddressSearchInput onSelect={handleAddressSearchInputSelect} />
        {address && (
          <WatchedAddressCard
            variant="create"
            address={address}
            powerStatus="synchronizing"
            lastSynchronizedAt={sub(new Date(), { seconds: 2 })}
            expandable={false}
          />
        )}
      </Stack>
    </form>
  );
};
