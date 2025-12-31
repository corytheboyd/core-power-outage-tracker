import { type FunctionComponent, useCallback, useState } from "react";
import { Stack } from "@mui/material";
import {
  AddressSearchInput,
  type AddressSearchInputOnSelectFunction,
} from "./AddressSearchInput.tsx";
import type { Address } from "../models/Address.ts";
import { AddressMapPreview } from "./AddressMapPreview.tsx";

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
        {address && <AddressMapPreview address={address} height={300} />}
      </Stack>
    </form>
  );
};
