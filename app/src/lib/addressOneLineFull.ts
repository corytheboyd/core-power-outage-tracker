import type { Address } from "../models/Address.ts";

export function addressOneLineFull(address: Address): string {
  return `${address.address}, ${address.city}, Colorado, ${address.zipcode}`;
}
