import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import type { SqlPrimitive } from "../types/app";
import type { DuckDbQuery } from "./DuckDbQuery.ts";

export interface UseDuckDbQueryFunction<
  Item = never,
  Args extends Record<string, SqlPrimitive> = Record<string, never>,
> {
  (connection: AsyncDuckDBConnection): Promise<DuckDbQuery<Args, Item>>;
}
