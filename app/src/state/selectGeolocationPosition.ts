import type { AppState } from "./useStore.ts";

export const selectGeolocationPosition = (
  state: AppState,
): GeolocationPosition | null => {
  if (state.geolocation.status == "granted") {
    return state.geolocation.position;
  }
  return null;
};
