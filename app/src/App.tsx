import PWABadge from "./PWABadge.tsx";
import Typography from "@mui/material/Typography";
import AddressSearch from "./lib/AddressSearch.tsx";

export function App() {
  return (
    <>
      <Typography>CORE Power Outage Tracker</Typography>
      <AddressSearch />
      <PWABadge />
    </>
  );
}
