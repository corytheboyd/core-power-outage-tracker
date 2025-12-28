export function positionToGeoJsonPoint(
  position: GeolocationPosition,
): geojson.Point {
  return {
    type: "Point",
    coordinates: [position.coords.longitude, position.coords.latitude],
  };
}
