import * as z from "zod";

export const AddressSchema = z.object({
  id: z.number(),
  address_line_1: z.string(),
  address_line_2: z.string(),
  city: z.string(),
  zipcode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export type Address = z.infer<typeof AddressSchema>;
