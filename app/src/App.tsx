import { useStore } from "./state/useStore.ts";
import { type FunctionComponent } from "react";
import PWABadge from "./components/PWABadge.tsx";
import { ManagePage } from "./components/pages/ManagePage.tsx";

export const App: FunctionComponent = () => {
  const fullStateForDebugging = useStore();

  return (
    <>
      <ManagePage />
      <hr />
      <pre>
        <code>{JSON.stringify(fullStateForDebugging, null, 2)}</code>
      </pre>
      <PWABadge />
    </>
  );
};
