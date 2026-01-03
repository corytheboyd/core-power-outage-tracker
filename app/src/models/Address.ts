import * as z from "zod";

export const AddressSchema = z.object({
  id: z.bigint(),
  address: z.string(),
  city: z.string(),
  county: z.string(),
  zipcode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export type Address = z.infer<typeof AddressSchema>;
