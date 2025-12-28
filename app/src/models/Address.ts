import * as z from "zod";

export const AddressSchema = z.object({
  id: z.number().nullish(),
  location: z.any().nullish(),
  addressNumber: z.string().nullish(),
  addressFull: z.string().nullish(),
  city: z.string().nullish(),
  zipcode: z.string().nullish(),
});

export type Address = z.infer<typeof AddressSchema>;
