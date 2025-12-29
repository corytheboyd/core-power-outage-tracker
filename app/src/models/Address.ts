import * as z from "zod";

export const AddressSchema = z.object({
  id: z.number(),
  addressFull: z.string(),
  city: z.string(),
  zipcode: z.string(),
});

export type Address = z.infer<typeof AddressSchema>;
