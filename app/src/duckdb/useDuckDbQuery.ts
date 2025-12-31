import type { UseDuckDbQueryFunction } from "./UseDuckDbQueryFunction.ts";
import type { SqlPrimitive } from "../types/app";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDuckDb } from "./useDuckDb.ts";
import type { DuckDbQuery } from "./DuckDbQuery.ts";
import { debounce, type DebouncedFunc, type DebounceSettings } from "lodash-es";

export interface UseDuckDbQueryOptions {
  debounce?: { wait: number } & DebounceSettings;
}

export function useDuckDbQuery<
  Item = never,
  Args extends Record<string, SqlPrimitive> = Record<string, never>,
>(
  fn: UseDuckDbQueryFunction<Item, Args>,
  options: { debounce: { wait: number } & DebounceSettings },
): DebouncedFunc<DuckDbQuery<Args, Item>["query"]> | null;

export function useDuckDbQuery<
  Item = never,
  Args extends Record<string, SqlPrimitive> = Record<string, never>,
>(
  fn: UseDuckDbQueryFunction<Item, Args>,
  options?: { debounce?: never },
): DuckDbQuery<Args, Item>["query"] | null;

export function useDuckDbQuery<
  Item = never,
  Args extends Record<string, SqlPrimitive> = Record<string, never>,
>(
  fn: UseDuckDbQueryFunction<Item, Args>,
  options?: UseDuckDbQueryOptions,
):
  | DuckDbQuery<Args, Item>["query"]
  | DebouncedFunc<DuckDbQuery<Args, Item>["query"]>
  | null {
  const [queryInstance, setQueryInstance] = useState<DuckDbQuery<
    Args,
    Item
  > | null>(null);
  const duckdb = useDuckDb();
  const connection = duckdb?.connection ?? null;

  useEffect(() => {
    if (!connection) {
      return;
    }
    fn(connection)
      .then((q) => {
        setQueryInstance(q);
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  }, [connection, fn]);

  const queryFn = useCallback(
    (args: Args) => queryInstance!.query(args),
    [queryInstance],
  );

  const debouncedQueryFn = useMemo(() => {
    if (!queryInstance || !options?.debounce) {
      return null;
    }
    const { wait, ...settings } = options.debounce;
    return debounce(queryFn, wait, settings);
  }, [queryInstance, queryFn, options?.debounce]);

  if (!queryInstance) {
    return null;
  }

  return debouncedQueryFn ?? queryFn;
}
