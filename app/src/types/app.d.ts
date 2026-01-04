import type { Address } from "../models/Address";

export type PowerStatus = "synchronizing" | "on" | "off" | "unknown";

export type AddressSearchResult = {
  address: Address;
  score: number;
  /**
   * meters
   * */
  distance: number;
};

export type SqlPrimitive = string | number | boolean | null;

type Position = { longitude: number; latitude: number };
