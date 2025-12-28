import PWABadge from "./PWABadge.tsx";
import AddressSearch from "./components/AddressSearch.tsx";
import { useStore } from "./state/useStore.ts";
import { useEffect } from "react";
import { getPosition } from "./lib/getPosition.ts";

export function App() {
  const state = useStore();

  useEffect(() => {
    getPosition()
      .then((p) => state.geolocation.setPosition(p))
      .catch((e) => state.geolocation.setError(e));
  }, [state.geolocation, state.geolocation.status]);

  return (
    <>
      <AddressSearch />
      <PWABadge />
      <hr />
      <pre>
        <code>{JSON.stringify(state, null, 2)}</code>
      </pre>
    </>
  );
}
