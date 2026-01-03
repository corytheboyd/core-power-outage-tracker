import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useDuckDbQuery } from "../duckdb/useDuckDbQuery.ts";
import { type FunctionComponent, useEffect, useState } from "react";
import { searchAddressesQueryFunction } from "../duckdb/queryFunctions/searchAddressesQueryFunction.ts";
import { useCurrentPosition } from "../geolocation/useCurrentPosition.ts";
import { closestAddressesQueryFunction } from "../duckdb/queryFunctions/closestAddressesQueryFunction.ts";
import { SEARCH_QUERY_DEBOUNCE_WAIT_MS } from "../constants.ts";
import type { AddressSearchResult } from "../types/app";
import { addressOneLineFull } from "../lib/addressOneLineFull.ts";
import { AddressFull } from "./presentation/AddressFull.tsx";

export type AddressSearchInputOnSelectFunction = (
  result: AddressSearchResult | null,
) => void;

type AddressSearchInputProps = {
  onSelect?: AddressSearchInputOnSelectFunction;
};

export const AddressSearchInput: FunctionComponent<AddressSearchInputProps> = ({
  onSelect,
}) => {
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [closestResults, setClosestResults] = useState<AddressSearchResult[]>(
    [],
  );
  const [activeResult, setActiveResult] = useState<AddressSearchResult | null>(
    null,
  );

  const position = useCurrentPosition();

  const closestAddressesQuery = useDuckDbQuery(closestAddressesQueryFunction);
  useEffect(() => {
    if (!closestAddressesQuery || !position) {
      return;
    }
    closestAddressesQuery({
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
    })
      .then((rs) => setClosestResults(rs.toArray()))
      .catch((e) => {
        throw e;
      });
  }, [closestAddressesQuery, position]);

  const searchAddressesQuery = useDuckDbQuery(searchAddressesQueryFunction, {
    debounce: {
      wait: SEARCH_QUERY_DEBOUNCE_WAIT_MS,
    },
  });

  const isLoading = !position || !searchAddressesQuery;

  return (
    <Autocomplete
      size="small"
      filterOptions={(x) => x}
      options={searchResults.length > 0 ? searchResults : closestResults}
      autoComplete
      filterSelectedOptions
      value={activeResult}
      noOptionsText="Address not found"
      loading={isLoading}
      onChange={(_, newValue) => {
        setActiveResult(newValue);
        if (onSelect) {
          onSelect(newValue);
        }
      }}
      onInputChange={(_, newInputValue, reason) => {
        if (reason == "blur") {
          return;
        }
        if (searchAddressesQuery && position) {
          searchAddressesQuery({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            searchTerm: newInputValue,
          })?.then((rs) => setSearchResults(rs.toArray()));
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
