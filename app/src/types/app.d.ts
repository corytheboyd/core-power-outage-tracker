import type { Address } from "../models/Address";

export type DuckDbStatus = "initializing" | "ready" | "error";

export type GeolocationStatus = "pending" | "granted" | "rejected";

export type AddressSearchResult = {
  address: Address;
  score: number;
  /**
   * meters
   * */
  distance: number;
};

export type WatchedAddress = {
  address: Address;
  addedAt: Date;
};

export type SqlPrimitive = string | number | boolean | null;
