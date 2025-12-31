import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { formatDistance } from "../lib/formatDistance.ts";
import { useDuckDbQuery } from "../duckdb/useDuckDbQuery.ts";
import { type FunctionComponent, useEffect, useState } from "react";
import { searchAddressesQueryFunction } from "../duckdb/queryFunctions/searchAddressesQueryFunction.ts";
import { useCurrentPosition } from "../geolocation/useCurrentPosition.ts";
import { closestAddressesQueryFunction } from "../duckdb/queryFunctions/closestAddressesQueryFunction.ts";
import { SEARCH_QUERY_DEBOUNCE_WAIT_MS } from "../constants.ts";
import type { AddressSearchResult } from "../types/app";

export type AddressSearchInputOnSelectFunction = (
  result: AddressSearchResult | null,
) => void;

type AddressSearchInputProps = {
  onSelect?: AddressSearchInputOnSelectFunction;
};

export const AddressSearchInput: FunctionComponent<AddressSearchInputProps> = (
  props,
) => {
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([]);
  const [closestResults, setClosestResults] = useState<AddressSearchResult[]>(
    [],
  );
  const [activeResult, setActiveResult] = useState<AddressSearchResult | null>(
    null,
  );

  const position = useCurrentPosition({ enableHighAccuracy: true });

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

  // TODO proper loading states instead
  if (!searchAddressesQuery || !position) {
    return null;
  }

  return (
    <Autocomplete
      size="small"
      filterOptions={(x) => x}
      options={searchResults.length > 0 ? searchResults : closestResults}
      autoComplete
      filterSelectedOptions
      value={activeResult}
      noOptionsText="Address not found"
      onChange={(_, newValue) => {
        setActiveResult(newValue);
        if (props.onSelect) {
          props.onSelect(newValue);
        }
      }}
      onInputChange={(_, newInputValue, reason) => {
        if (reason == "blur") {
          return;
        }
        searchAddressesQuery({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          searchTerm: newInputValue,
        })?.then((rs) => setSearchResults(rs.toArray()));
      }}
      renderInput={(params) => (
        <TextField {...params} label="Search for an address" />
      )}
      getOptionLabel={(option) => option.address.address_line_1}
      getOptionKey={(option) => option.address.id}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Grid container sx={{ alignItems: "center" }}>
              <Grid sx={{ display: "flex", width: 44 }}>
                <LocationOnIcon sx={{ color: "text.secondary" }} />
              </Grid>
              <Grid sx={{ width: "calc(100% - 44px)", wordWrap: "break-word" }}>
                <Typography>
                  {option.address.address_line_1}
                  {option.address.address_line_2 != "" && (
                    <>
                      {" "}
                      <Typography component="span" sx={{ display: "inline" }}>
                        {option.address.address_line_2}
                      </Typography>
                    </>
                  )}
                  {", "}
                  {option.address.city}
                  {", CO "}
                  {option.address.zipcode}
                </Typography>
                <Typography variant="caption">
                  {formatDistance(option.distance)}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
};
