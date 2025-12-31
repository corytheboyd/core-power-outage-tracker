import { type FunctionComponent, useCallback, useState } from "react";
import { Stack } from "@mui/material";
import { AddressSearchInput } from "./AddressSearchInput.tsx";
import type { Address } from "../models/Address.ts";
import type { AddressSearchResult } from "../types/app";

export const NewWatchedAddressForm: FunctionComponent = () => {
  const [address, setAddress] = useState<Address | null>();

  const handleAddressSearchInputSelect = useCallback(
    (result: AddressSearchResult) => {
      setAddress(result.address);
    },
    [],
  );

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
          <pre>
            <code>{JSON.stringify(address, null, 2)}</code>
          </pre>
        )}
      </Stack>
    </form>
  );
};
