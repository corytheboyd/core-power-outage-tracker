import { useCallback, useEffect, useState } from "react";

export function useDateNow(options?: { update: { interval: number } }) {
  const [now, setNow] = useState(new Date());

  const update = useCallback(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!options?.update) {
      return;
    }
    const timeout = setInterval(update);
    return () => clearTimeout(timeout);
  }, [options?.update, update]);

  return now;
}
