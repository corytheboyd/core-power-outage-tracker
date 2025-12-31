import type { AsyncPreparedStatement } from "@duckdb/duckdb-wasm";

type DuckDbTable = Awaited<ReturnType<AsyncPreparedStatement["query"]>>;

export class ResultSet<T> implements Iterable<T> {
  private readonly result: DuckDbTable;

  constructor(result: DuckDbTable) {
    this.result = result;
  }

  *[Symbol.iterator](): Iterator<T> {
    const rows = this.result.toArray();
    for (const row of rows) {
      yield row.toJSON() as T;
    }
  }

  toArray(): T[] {
    return [...this];
  }

  first(): T {
    return this.toArray()[0];
  }
}
