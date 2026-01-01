import * as z from "zod";

export const ServiceLineSchema = z.object({
  id: z.number(),
  geometry: z.array(z.tuple([z.number(), z.number()])),
});

export type ServiceLine = z.infer<typeof ServiceLineSchema>;
