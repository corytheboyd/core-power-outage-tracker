import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { type FunctionComponent, useEffect, useState } from "react";
import { useCurrentPosition } from "../geolocation/useCurrentPosition.ts";
import { SEARCH_QUERY_DEBOUNCE_WAIT_MS } from "../constants.ts";
import type { AddressSearchResult } from "../types/app";
import { addressOneLineFull } from "../lib/addressOneLineFull.ts";
import { AddressFull } from "./presentation/AddressFull.tsx";
import { debounce } from "lodash-es";
import { searchAddresses } from "../duckdb/queries/searchAddresses.ts";
import { getNearbyAddresses } from "../duckdb/queries/getNearbyAddresses.ts";

export type AddressSearchInputOnSelectFunction = (
  result: AddressSearchResult | null,
) => void;

type AddressSearchInputProps = {
  onSelect?: AddressSearchInputOnSelectFunction;
};

const debouncedSearchAddresses = debounce(
  searchAddresses,
  SEARCH_QUERY_DEBOUNCE_WAIT_MS,
);

export const AddressSearchInput: FunctionComponent<AddressSearchInputProps> = ({
  onSelect,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [nearbyResults, setNearbyResults] = useState<AddressSearchResult[]>(
    [],
  );
  const [activeResult, setActiveResult] = useState<AddressSearchResult | null>(
    null,
  );
  const position = useCurrentPosition();

  useEffect(() => {
    if (!position) {
      return;
    }
    getNearbyAddresses({
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
    })
      .then((results) => setNearbyResults(results))
      .catch((e) => {
        throw e;
      });
  }, [position]);

  return (
    <Autocomplete
      size="small"
      filterOptions={(x) => x}
      options={inputValue.length > 0 ? searchResults : nearbyResults}
      autoComplete
      filterSelectedOptions
      value={activeResult}
      noOptionsText="Address not found"
      onChange={(_, newValue) => {
        setActiveResult(newValue);
        if (onSelect) {
          onSelect(newValue);
        }
      }}
      onInputChange={(_, newValue, reason) => {
        setInputValue(newValue);
        if (reason == "blur") {
          return;
        }
        if (!position) {
          return;
        }
        if (newValue.length > 0) {
          debouncedSearchAddresses({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            searchTerm: newValue,
          })
            ?.then((results) => setSearchResults(results))
            .catch((e) => {
              throw e;
            });
        }
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
