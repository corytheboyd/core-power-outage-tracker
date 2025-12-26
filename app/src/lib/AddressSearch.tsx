import * as React from "react";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import parse from "autosuggest-highlight/parse";

// For the sake of this demo, we have to use debounce to reduce Google Maps Places API quote use
// But prefer to use throttle in practice
// import throttle from 'lodash/throttle';
import { debounce } from "@mui/material/utils";

interface MainTextMatchedSubstrings {
  offset: number;
  length: number;
}
interface StructuredFormatting {
  main_text: string;
  main_text_matched_substrings: readonly MainTextMatchedSubstrings[];
  secondary_text?: string;
}
interface PlaceType {
  description: string;
  structured_formatting: StructuredFormatting;
}

const fetch = debounce(
  async (
    request: { input: string },
    callback: (results?: readonly PlaceType[]) => void,
  ) => {
    callback(request.input.length === 1 ? fakeAnswer.p : fakeAnswer.paris);
  },
  400,
);

const emptyOptions: readonly PlaceType[] = [];

export default function AddressSearch() {
  const [value, setValue] = React.useState<PlaceType | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] =
    React.useState<readonly PlaceType[]>(emptyOptions);

  useEffect(() => {
    if (inputValue === "") {
      setOptions(value ? [value] : emptyOptions);
      return undefined;
    }

    // Allow to resolve the out-of-order request resolution.
    let active = true;

    fetch({ input: inputValue }, (results?: readonly PlaceType[]) => {
      if (!active) {
        return;
      }

      let newOptions: readonly PlaceType[] = [];

      if (results) {
        newOptions = results;

        if (value) {
          newOptions = [
            value,
            ...results.filter(
              (result) => result.description !== value.description,
            ),
          ];
        }
      } else if (value) {
        newOptions = [value];
      }
      setOptions(newOptions);
    });

    return () => {
      active = false;
    };
  }, [value, inputValue]);

  return (
    <Autocomplete
      sx={{ width: 300 }}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.description
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText="No locations"
      onChange={(_, newValue: PlaceType | null) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
      }}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Add a location" fullWidth />
      )}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        const matches =
          option.structured_formatting.main_text_matched_substrings;

        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length]),
        );
        return (
          <li key={key} {...optionProps}>
            <Grid container sx={{ alignItems: "center" }}>
              <Grid sx={{ display: "flex", width: 44 }}>
                <LocationOnIcon sx={{ color: "text.secondary" }} />
              </Grid>
              <Grid sx={{ width: "calc(100% - 44px)", wordWrap: "break-word" }}>
                {parts.map((part, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={{
                      fontWeight: part.highlight
                        ? "fontWeightBold"
                        : "fontWeightRegular",
                    }}
                  >
                    {part.text}
                  </Box>
                ))}
                {option.structured_formatting.secondary_text ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {option.structured_formatting.secondary_text}
                  </Typography>
                ) : null}
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}

// Fake data in case Google Maps Places API returns a rate limit.
const fakeAnswer = {
  p: [
    {
      description: "Portugal",
      structured_formatting: {
        main_text: "Portugal",
        main_text_matched_substrings: [{ offset: 0, length: 1 }],
      },
    },
    {
      description: "Puerto Rico",
      structured_formatting: {
        main_text: "Puerto Rico",
        main_text_matched_substrings: [{ offset: 0, length: 1 }],
      },
    },
    {
      description: "Pakistan",
      structured_formatting: {
        main_text: "Pakistan",
        main_text_matched_substrings: [{ offset: 0, length: 1 }],
      },
    },
    {
      description: "Philippines",
      structured_formatting: {
        main_text: "Philippines",
        main_text_matched_substrings: [{ offset: 0, length: 1 }],
      },
    },
    {
      description: "Paris, France",
      structured_formatting: {
        main_text: "Paris",
        main_text_matched_substrings: [{ offset: 0, length: 1 }],
        secondary_text: "France",
      },
    },
  ],
  paris: [
    {
      description: "Paris, France",
      structured_formatting: {
        main_text: "Paris",
        main_text_matched_substrings: [{ offset: 0, length: 5 }],
        secondary_text: "France",
      },
    },
    {
      description: "Paris, TX, USA",
      structured_formatting: {
        main_text: "Paris",
        main_text_matched_substrings: [{ offset: 0, length: 5 }],
        secondary_text: "TX, USA",
      },
    },
    {
      description: "Paris Beauvais Airport, Route de l'Aéroport, Tillé, France",
      structured_formatting: {
        main_text: "Paris Beauvais Airport",
        main_text_matched_substrings: [{ offset: 0, length: 5 }],
        secondary_text: "Route de l'Aéroport, Tillé, France",
      },
    },
    {
      description:
        "Paris Las Vegas, South Las Vegas Boulevard, Las Vegas, NV, USA",
      structured_formatting: {
        main_text: "Paris Las Vegas",
        main_text_matched_substrings: [{ offset: 0, length: 5 }],
        secondary_text: "South Las Vegas Boulevard, Las Vegas, NV, USA",
      },
    },
    {
      description:
        "Paris La Défense Arena, Jardin de l'Arche, Nanterre, France",
      structured_formatting: {
        main_text: "Paris La Défense Arena",
        main_text_matched_substrings: [{ offset: 0, length: 5 }],
        secondary_text: "Jardin de l'Arche, Nanterre, France",
      },
    },
  ],
};
