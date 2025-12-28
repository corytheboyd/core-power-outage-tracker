export async function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        (e) => reject(e),
        { enableHighAccuracy: true },
      );
    }
    return null;
  });
}
