import * as z from "zod";

export const LineStringSchema = z.object({
  /**
   * GeoJSON
   * */
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  }),
});

export type LineString = z.infer<typeof LineStringSchema>;
