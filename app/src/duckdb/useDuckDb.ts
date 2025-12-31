import { useEffect, useState } from "react";
import { DuckDbManager } from "./DuckDbManager.ts";
import { getDuckDbManager } from "./getDuckDbManager.ts";

export function useDuckDb(): DuckDbManager | null {
  const [manager, setManager] = useState<DuckDbManager | null>(null);

  useEffect(() => {
    getDuckDbManager()
      .then((db) => {
        setManager(db);
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  }, []);

  return manager;
}
