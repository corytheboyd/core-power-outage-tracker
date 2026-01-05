import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Position, PowerStatus } from "../types/app";
import type { Address } from "../models/Address.ts";

export type WatchedAddress = {
  address: Address;
  powerStatus: PowerStatus;
  lastSynchronizedAt: Date;
  label?: string;
  mapPosition: Position;
  mapZoom: number;
};

export type WatchedAddressWorkingCopy = Omit<
  PartialBy<WatchedAddress, "address" | "powerStatus">,
  "lastSynchronizedAt"
>;

interface WatchedAddresses {
  workingCopy: WatchedAddressWorkingCopy;
  entries: Record<Address["id"], WatchedAddress>;
  updateWorkingCopy: (updates: Partial<WatchedAddressWorkingCopy>) => void;
  commitWorkingCopy: () => void;
  add: (value: WatchedAddress) => void;
  remove: (addressId: Address["id"]) => void;
}

export interface AppState {
  watchedAddresses: WatchedAddresses;
}

const defaultPosition: Position = {
  latitude: 39.520577,
  longitude: -105.3064,
};

const defaultWatchedAddressWorkingCopy: WatchedAddressWorkingCopy = {
  mapPosition: defaultPosition,
  mapZoom: 13,
};

export const useStore = create<AppState>()(
  immer((set) => ({
    watchedAddresses: {
      workingCopy: defaultWatchedAddressWorkingCopy,
      entries: {},
      updateWorkingCopy: (updates) =>
        set((state) => {
          state.watchedAddresses.workingCopy = {
            ...state.watchedAddresses.workingCopy,
            ...updates,
          };
        }),
      commitWorkingCopy: () =>
        set((state) => {
          const workingCopy = state.watchedAddresses.workingCopy;
          if (!workingCopy.address) {
            throw new Error("Invalid WatchedAddress");
          }
          state.watchedAddresses.entries[workingCopy.address.id] =
            workingCopy as WatchedAddress;
          state.watchedAddresses.workingCopy = defaultWatchedAddressWorkingCopy;
        }),
      add: (newValue) =>
        set((state) => {
          state.watchedAddresses.entries[newValue.address.id] = newValue;
        }),
      remove: (addressId) =>
        set((state) => {
          delete state.watchedAddresses.entries[addressId];
        }),
    },
  })),
);
