import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useStore } from "../state/useStore.ts";
import { addressSearch } from "../duckdb.ts";
import { debounce } from "lodash-es";

const debouncedAddressSearch = debounce(addressSearch, 250, { maxWait: 1000 });

export default function AddressSearch() {
  const {
    setSearchTerm,
    searchResults,
    setSearchResults,
    activeSearchResult,
    setActiveSearchResult,
  } = useStore((state) => state.addressSearch);

  return (
    <Autocomplete
      sx={{ width: 300 }}
      getOptionLabel={(option) => option.address.addressFull}
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
        debouncedAddressSearch(newInputValue)?.then((results) =>
          setSearchResults(results),
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label="Add a location" fullWidth />
      )}
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
                <Typography>{option.address.addressFull}</Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}
