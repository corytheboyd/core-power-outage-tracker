import * as z from "zod";

export const AddressClusterSchema = z.object({
  count: z.number(),
  latitude: z.number(),
  longitude: z.number(),
});

export type AddressCluster = z.infer<typeof AddressClusterSchema>;
