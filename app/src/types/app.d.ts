import type { Address } from "../models/Address";

namespace app {
  type DuckDbState = "initializing" | "ready" | "error";

  type AddressSearchResult = {
    address: Address;
    score: number;
  };
}
