import { Protocol } from "pmtiles";
import { addProtocol, removeProtocol } from "maplibre-gl";
import { synchronizeAddressesTable } from "./duckdb/operations/synchronizeAddressesTable.ts";
import { synchronizeServiceLinesTable } from "./duckdb/operations/synchronizeServiceLinesTable.ts";
import { getDuckDbManager } from "./duckdb/getDuckDbManager.ts";
import { useEffect, useRef, useState } from "react";
import { synchronizeOutageLinesTable } from "./duckdb/operations/synchronizeOutageLinesTable.ts";

export function useAppInitialize(): {
  status: string;
  progress: number;
  loading: boolean;
} {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading...");
  const [progress, setProgress] = useState(0);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) {
      return;
    } else {
      called.current = true;
    }

    console.log("App initializing...");
    setProgress(10);

    (async () => {
      const protocol = new Protocol();
      addProtocol("pmtiles", protocol.tile);

      setStatus("Initializing database...");
      const duckdb = await getDuckDbManager();
      setProgress(20);

      setStatus("Creating addresses lookup table...");
      await synchronizeAddressesTable(duckdb);
      setProgress(40);

      setStatus("Setting up service area geometry...");
      await synchronizeServiceLinesTable(duckdb);
      setProgress(60);

      setStatus("Fetching outage geometry...");
      await synchronizeOutageLinesTable(duckdb);
      setProgress(80);

      console.log("App initialization done!");
      setLoading(false);
      setProgress(100);

      return () => {
        (async () => {
          console.log("App tearing down...");

          removeProtocol("pmtiles");
          await duckdb.teardown();

          console.log("App teardown done!");
        })();
      };
    })();
  }, []);

  return { loading, status, progress };
}
