import PWABadge from "./PWABadge.tsx";
import AddressSearch from "./components/AddressSearch.tsx";
import { useStore } from "./state/useStore.ts";
import { type FunctionComponent, useEffect } from "react";
import { getPosition } from "./lib/getPosition.ts";
import { NeedGeolocationPage } from "./components/NeedGeolocationPage.tsx";

export const App: FunctionComponent = () => {
  const state = useStore();
  const hasGeolocation = useStore(
    (state) => state.geolocation.status == "granted",
  );

  useEffect(() => {
    getPosition()
      .then((p) => state.geolocation.setPosition(p))
      .catch((e) => state.geolocation.setError(e));
  }, [state.geolocation]);

  return (
    <>
      {!hasGeolocation && <NeedGeolocationPage />}
      {hasGeolocation && <AddressSearch />}
      <PWABadge />
      <hr />
      <pre>
        <code>{JSON.stringify(state, null, 2)}</code>
      </pre>
    </>
  );
};
