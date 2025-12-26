import * as z from "zod";

export const Address = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
});
