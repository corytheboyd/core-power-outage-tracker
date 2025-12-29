import AddressSearchInput from "./components/AddressSearchInput.tsx";
import { useStore } from "./state/useStore.ts";
import { type FunctionComponent, useEffect } from "react";
import { getPosition } from "./geolocation/getPosition.ts";
import { NeedGeolocationPage } from "./components/NeedGeolocationPage.tsx";
import { closestAddresses } from "./queries/closestAddresses.ts";
import { useShallow } from "zustand/react/shallow";
import PWABadge from "./components/PWABadge.tsx";

export const App: FunctionComponent = () => {
  const fullStateForDebugging = useStore();

  const setRecommendedResults = useStore(
    (state) => state.addressSearch.setRecommendedResults,
  );
  const { setPosition, setError } = useStore(
    useShallow((state) => state.geolocation),
  );
  const position = useStore(
    useShallow((state) => {
      if (state.geolocation.status == "granted") {
        return state.geolocation.position;
      }
    }),
  );
  const hasPosition = position != undefined;

  useEffect(() => {
    getPosition()
      .then((p) => setPosition(p))
      .catch((e) => setError(e));
  }, [setPosition, setError]);

  useEffect(() => {
    if (hasPosition) {
      closestAddresses(position).then((r) => setRecommendedResults(r));
    }
  }, [hasPosition, position, setRecommendedResults]);

  return (
    <>
      {!hasPosition && <NeedGeolocationPage />}
      {hasPosition && <AddressSearchInput />}
      <PWABadge />
      <hr />
      <pre>
        <code>{JSON.stringify(fullStateForDebugging, null, 2)}</code>
      </pre>
    </>
  );
};
