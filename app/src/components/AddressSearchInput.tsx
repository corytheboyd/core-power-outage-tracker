import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { type FunctionComponent, useCallback, useMemo, useState } from "react";
import { ADDRESS_SEARCH_INPUT_DEBOUNCE_WAIT_MS } from "../constants.ts";
import type { AddressSearchResult } from "../types/app";
import { addressOneLineFull } from "../lib/addressOneLineFull.ts";
import { AddressFull } from "./presentation/AddressFull.tsx";
import { debounce } from "lodash-es";

export type AddressSearchInputOnSelectFunction = (
  result: AddressSearchResult | null,
) => void;

export type AddressSearchInputOnRequestSearchFunction = (query: string) => void;

type AddressSearchInputProps = {
  value?: AddressSearchResult;
  nearbyResults?: AddressSearchResult[];
  searchResults?: AddressSearchResult[];
  onRequestSearch?: AddressSearchInputOnRequestSearchFunction;
  onSelect?: AddressSearchInputOnSelectFunction;
};

export const AddressSearchInput: FunctionComponent<AddressSearchInputProps> = ({
  value,
  nearbyResults = [],
  searchResults = [],
  onRequestSearch,
  onSelect,
}) => {
  const [inputValue, setInputValue] = useState("");

  let options = nearbyResults;
  if (inputValue.length > 0) {
    options = searchResults;
  }

  const debouncedOnRequestSearch = useMemo(() => {
    if (!onRequestSearch) return;
    return debounce(onRequestSearch, ADDRESS_SEARCH_INPUT_DEBOUNCE_WAIT_MS);
  }, [onRequestSearch]);

  const handleInputChange = useCallback(
    (newValue: string) => {
      if (!debouncedOnRequestSearch) return;
      debouncedOnRequestSearch(newValue);
    },
    [debouncedOnRequestSearch],
  );

  const handleSelect = useCallback(
    (value: AddressSearchResult | null) => {
      if (!onSelect) return;
      onSelect(value);
    },
    [onSelect],
  );

  return (
    <Autocomplete
      size="small"
      filterOptions={(x) => x}
      options={options}
      autoComplete
      filterSelectedOptions
      value={value}
      noOptionsText="Address not found"
      onChange={(_, newValue) => handleSelect(newValue)}
      onInputChange={(_, newValue, reason) => {
        setInputValue(newValue);
        if (reason == "blur") return;
        handleInputChange(newValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Search for an address" />
      )}
      getOptionLabel={(option) => addressOneLineFull(option.address)}
      getOptionKey={(option) => option.address.id}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <AddressFull address={option.address} distance={option.distance} />
          </li>
        );
      }}
    />
  );
};
