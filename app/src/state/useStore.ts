import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WatchedAddress } from "../types/app";
import type { Address } from "../models/Address.ts";

interface WatchedAddresses {
  addresses: WatchedAddress[];
  addAddress: (address: Address) => void;
  removeAddress: (addressId: number) => void;
}

export interface AppState {
  watchedAddresses: WatchedAddresses;
}

export const useStore = create<AppState>()(
  immer((set) => ({
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
