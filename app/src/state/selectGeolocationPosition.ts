import type { AppState } from "./useStore.ts";

export const selectGeolocationPosition = (
  state: AppState,
): GeolocationPosition => {
  if (state.geolocation.status == "granted") {
    return state.geolocation.position;
  }
  throw new Error("Geolocation permission not granted");
};
