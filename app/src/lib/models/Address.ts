import * as z from "zod";

export const Address = z.object({
  id: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipcode: z.string().optional(),
});
