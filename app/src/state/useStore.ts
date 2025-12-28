import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { type app } from "../types/app";

interface DuckDb {
  state: app.DuckDbState;
  setState: (value: app.DuckDbState) => void;
}

interface AddressSearch {
  searchTerm: string;
  searchResults: app.AddressSearchResult[];
  setSearchTerm: (value: string) => void;
  search: () => Promise<void>;
}

interface AppState {
  duckdb: DuckDb;
  addressSearch: AddressSearch;
}

export const useStore = create<AppState>()(
  immer((set) => ({
    duckdb: {
      state: "initializing",
      setState: (value) =>
        set((state) => {
          state.duckdb.state = value;
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
