export async function getPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        (e) => {
          console.error(e);
          resolve(null);
        },
        { enableHighAccuracy: true },
      );
    }
    return null;
  });
}
