import { useEffect, useRef, useState } from "react";

export function useCurrentPosition(): GeolocationPosition | null {
  const hasRequested = useRef(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);

  if (!("geolocation" in navigator)) {
    throw new Error("geolocation feature not available");
  }

  useEffect(() => {
    if (hasRequested.current) {
      return;
    }
    hasRequested.current = true;
    console.log("navigator.geolocation.getCurrentPosition");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition(p);
      },
      (e) => {
        throw e;
      },
      {
        enableHighAccuracy: true,
      },
    );
  }, []);

  return position;
}
