import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  AddressSearchResult,
  DuckDbStatus,
  GeolocationStatus,
  WatchedAddress,
} from "../types/app";

type DuckDb = {
  status: DuckDbStatus;
  setStatus: (value: DuckDbStatus) => void;
} & (
  | { status: "initializing" }
  | { status: "ready" }
  | { status: "error"; error?: Error }
);

interface AddressSearch {
  searchTerm: string;
  searchResults: AddressSearchResult[];
  activeSearchResult: AddressSearchResult | null;
  recommendedResults: AddressSearchResult[];
  setSearchTerm: (value: string) => void;
  setSearchResults: (value: AddressSearchResult[]) => void;
  setActiveSearchResult: (value: AddressSearchResult | null) => void;
  setRecommendedResults: (value: AddressSearchResult[]) => void;
}

type Geolocation = {
  status: GeolocationStatus;
  setPosition: (value: GeolocationPosition) => void;
  setError: (value: GeolocationPositionError) => void;
} & (
  | { status: "pending" }
  | { status: "granted"; position: GeolocationPosition }
  | { status: "rejected"; error: GeolocationPositionError }
);

interface WatchedAddresses {
  addresses: WatchedAddress[];
  addAddress: (address: Address) => void;
  removeAddress: (addressId: number) => void;
}

export interface AppState {
  geolocation: Geolocation;
  duckdb: DuckDb;
  addressSearch: AddressSearch;
  watchedAddresses: WatchedAddresses;
}

export const useStore = create<AppState>()(
  immer((set) => ({
    geolocation: {
      status: "pending",
      setPosition: (value) =>
        set((state) => {
          state.geolocation.status = "granted";
          if (state.geolocation.status == "granted") {
            state.geolocation.position = value;
          }
        }),
      setError: (value) =>
        set((state) => {
          state.geolocation.status = "rejected";
          if (state.geolocation.status == "rejected") {
            state.geolocation.error = value;
          }
        }),
    },
    duckdb: {
      status: "initializing",
      setStatus: (value) =>
        set((state) => {
          state.duckdb.status = value;
        }),
    },
    addressSearch: {
      searchTerm: "",
      searchResults: [],
      activeSearchResult: null,
      recommendedResults: [],
      setSearchTerm: (value) =>
        set((state) => {
          state.addressSearch.searchTerm = value;
        }),
      setSearchResults: (value) =>
        set((state) => {
          state.addressSearch.searchResults = value;
        }),
      setActiveSearchResult: (value) =>
        set((state) => {
          state.addressSearch.activeSearchResult = value;
        }),
      setRecommendedResults: (value) =>
        set((state) => {
          state.addressSearch.recommendedResults = value;
        }),
    },
    watchedAddresses: {
      addresses: [],
      addAddress: (address) =>
        set((state) => {
          const exists = state.watchedAddresses.addresses.some(
            (watched) => watched.address.id === address.id,
          );
          if (!exists) {
            state.watchedAddresses.addresses.push({
              address,
              addedAt: new Date(),
            });
          }
        }),
      removeAddress: (addressId) =>
        set((state) => {
          state.watchedAddresses.addresses =
            state.watchedAddresses.addresses.filter(
              (watched) => watched.address.id !== addressId,
            );
        }),
    },
  })),
);
