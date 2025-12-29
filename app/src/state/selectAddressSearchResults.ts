import type { AppState } from "./useStore.ts";

export const selectAddressSearchResults = (state: AppState) => {
  const { searchResults, recommendedResults } = state.addressSearch;
  if (searchResults.length > 0) {
    return searchResults;
  }
  return recommendedResults;
};
