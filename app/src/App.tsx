import { type FunctionComponent } from "react";
import PWABadge from "./components/PWABadge.tsx";
import { ManagePage } from "./components/pages/ManagePage.tsx";

export const App: FunctionComponent = () => {
  return (
    <>
      <ManagePage />
      <PWABadge />
    </>
  );
};
