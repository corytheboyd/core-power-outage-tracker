import type { Address } from "../models/Address.ts";

export function addressOneLineFull(address: Address): string {
  let result = `${address.address_line_1}`;
  if (address.address_line_2.length > 0) {
    result += " " + address.address_line_2;
  }
  result += ", " + address.city + ", CO, " + address.zipcode;
  return result;
}
