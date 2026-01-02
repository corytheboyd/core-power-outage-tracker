import { useEffect, useRef, useState } from "react";

export function useCurrentPosition(
  options: PositionOptions = {},
): GeolocationPosition | null {
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
    console.log("navigator.geolocation.getCurrentPosition", options);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition(p);
      },
      (e) => {
        throw e;
      },
      options,
    );
  }, [options]);

  return position;
}
