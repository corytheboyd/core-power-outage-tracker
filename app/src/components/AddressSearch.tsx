import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useStore } from "../state/useStore.ts";
import { debounce } from "lodash-es";
import { useEffect } from "react";
import { topClosestAddresses } from "../queries/topClosestAddresses.ts";
import { selectGeolocationPosition } from "../state/selectGeolocationPosition.ts";
import { selectAddressSearchResults } from "../state/selectAddressSearchResults.ts";
import { addressSearch } from "../queries/searchAddresses.ts";

const debouncedAddressSearch = debounce(addressSearch, 250, { maxWait: 1000 });

export default function AddressSearch() {
  const {
    setSearchTerm,
    setSearchResults,
    activeSearchResult,
    setActiveSearchResult,
    setRecommendedResults,
  } = useStore((state) => state.addressSearch);
  const searchResults = useStore(selectAddressSearchResults);
  const position = useStore(selectGeolocationPosition);

  useEffect(() => {
    if (position != null) {
      topClosestAddresses(position).then((r) => setRecommendedResults(r));
    }
  }, [position, setRecommendedResults]);

  return (
    <Autocomplete
      sx={{ width: 300 }}
      filterOptions={(x) => x}
      options={searchResults}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={activeSearchResult}
      noOptionsText="Address not found"
      onChange={(_, newValue) => {
        // setOptions(newValue ? [newValue, ...options] : options);
        setActiveSearchResult(newValue);
      }}
      onInputChange={(_, newInputValue) => {
        setSearchTerm(newInputValue);
        debouncedAddressSearch(newInputValue, position)?.then((results) =>
          setSearchResults(results),
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label="Add a location" fullWidth />
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
                <Typography>{option.address.address_line_1}</Typography>
                {option.address.address_line_2 != "" && (
                  <Typography>{option.address.address_line_2}</Typography>
                )}
                <Typography variant="caption">
                  {Math.round(option.distanceMeters)} meters
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}
