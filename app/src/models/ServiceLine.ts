import * as z from "zod";

export const ServiceLineSchema = z.object({
  /**
   * GeoJSON
   * */
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  }),
});

export type ServiceLine = z.infer<typeof ServiceLineSchema>;
