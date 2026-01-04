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

export type NewWatchedAddress = Omit<
  PartialBy<WatchedAddress, "address" | "powerStatus">,
  "lastSynchronizedAt"
>;

interface WatchedAddresses {
  new: NewWatchedAddress;
  entries: Record<Address["id"], WatchedAddress>;
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

const defaultNewWatchedAddress: NewWatchedAddress = {
  mapPosition: defaultPosition,
  mapZoom: 13,
};

export const useStore = create<AppState>()(
  immer((set) => ({
    watchedAddresses: {
      new: defaultNewWatchedAddress,
      entries: {},
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
