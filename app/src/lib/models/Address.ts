import * as z from "zod";

export const Address = z.object({
  id: z.number().nullish(),
  location: z.any().nullish(),
  addressNumber: z.string().nullish(),
  addressFull: z.string().nullish(),
  city: z.string().nullish(),
  zipcode: z.string().nullish(),
});
