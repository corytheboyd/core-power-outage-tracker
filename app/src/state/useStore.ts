import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  AddressSearchResult,
  DuckDbStatus,
  GeolocationStatus,
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
  setSearchTerm: (value: string) => void;
  search: () => Promise<void>;
}

type Geolocation = { status: GeolocationStatus } & (
  | { status: "pending" }
  | { status: "granted"; position: GeolocationPosition }
  | { status: "rejected"; error: GeolocationPositionError }
);

interface AppState {
  geolocation: Geolocation;
  duckdb: DuckDb;
  addressSearch: AddressSearch;
}

export const useStore = create<AppState>()(
  immer((set) => ({
    geolocation: {
      status: "pending",
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
      setSearchTerm: (value) =>
        set((state) => {
          state.addressSearch.searchTerm = value;
        }),
      search: async () => set((state) => {}),
    },
  })),
);
