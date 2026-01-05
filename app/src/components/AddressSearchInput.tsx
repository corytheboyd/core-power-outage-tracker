import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { type FunctionComponent, useCallback, useState } from "react";
import { ADDRESS_SEARCH_INPUT_DEBOUNCE_WAIT_MS } from "../constants.ts";
import { addressOneLineFull } from "../lib/addressOneLineFull.ts";
import { AddressFull } from "./presentation/AddressFull.tsx";
import { debounce } from "lodash-es";
import { searchAddresses } from "../duckdb/queries/searchAddresses.ts";
import type { Address } from "../models/Address.ts";

export type AddressSearchInputOnSelectFunction = (
  address: Address | null,
) => void;

export type AddressSearchInputOnRequestSearchFunction = (query: string) => void;

type AddressSearchInputProps = {
  onSelect?: AddressSearchInputOnSelectFunction;
};

const debouncedSearchAddresses = debounce(
  searchAddresses,
  ADDRESS_SEARCH_INPUT_DEBOUNCE_WAIT_MS,
);

export const AddressSearchInput: FunctionComponent<AddressSearchInputProps> = ({
  onSelect,
}) => {
  const [results, setResults] = useState<Address[]>([]);
  const [value, setValue] = useState<Address | null>(null);

  const handleInputChange = useCallback((value: string) => {
    if (value.length == 0) {
      setResults([]);
      return;
    }
    debouncedSearchAddresses({
      searchTerm: value,
    })
      ?.then((addresses) => setResults(addresses))
      .catch((e) => {
        throw e;
      });
  }, []);

  const handleChange = useCallback(
    (value: Address | null) => {
      setValue(value);
      if (!onSelect) return;
      onSelect(value);
    },
    [onSelect],
  );

  return (
    <Autocomplete
      size="small"
      filterOptions={(x) => x}
      options={results}
      autoComplete
      filterSelectedOptions
      value={value}
      noOptionsText="Address not found"
      onChange={(_, newValue) => handleChange(newValue)}
      onInputChange={(_, newValue, reason) => {
        if (reason == "blur") return;
        handleInputChange(newValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Search for an address" />
      )}
      getOptionLabel={(address) => addressOneLineFull(address)}
      getOptionKey={(address) => address.id}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <AddressFull address={option} />
          </li>
        );
      }}
    />
  );
};
