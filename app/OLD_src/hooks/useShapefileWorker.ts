import { useEffect, useRef, useState, useCallback } from "react";
import type { WorkerResponse } from "../workers/types";

type Status = "idle" | "loading" | "complete" | "error";

interface UseShapefileWorkerResult {
  status: Status;
  progress: { loaded: number; total: number; stage: string };
  error: string | null;
  totalFeatures: number;
  search: (query: string) => void;
  searchResults: GeoJSON.Feature[];
}

export function useShapefileWorker(url: string): UseShapefileWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ loaded: 0, total: 100, stage: "" });
  const [error, setError] = useState<string | null>(null);
  const [totalFeatures, setTotalFeatures] = useState(0);
  const [searchResults, setSearchResults] = useState<GeoJSON.Feature[]>([]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/shapefile.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;
    setStatus("loading");

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const message = e.data;

      switch (message.type) {
        case "PROGRESS":
          setProgress({
            loaded: message.loaded,
            total: message.total,
            stage: message.stage,
          });
          break;

        case "COMPLETE":
          setTotalFeatures(message.totalFeatures);
          setStatus("complete");
          setProgress({ loaded: 100, total: 100, stage: "Complete" });
          break;

        case "SEARCH_RESULTS":
          setSearchResults(message.results);
          break;

        case "ERROR":
          setError(message.error);
          setStatus("error");
          break;
      }
    };

    worker.postMessage({ type: "INIT", url });

    return () => {
      worker.postMessage({ type: "CANCEL" });
      worker.terminate();
    };
  }, [url]);

  const search = useCallback((query: string) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "SEARCH", query });
    }
  }, []);

  return { status, progress, error, totalFeatures, search, searchResults };
}
