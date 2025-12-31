import type { AsyncPreparedStatement } from "@duckdb/duckdb-wasm";

type DuckDbTable = Awaited<ReturnType<AsyncPreparedStatement["query"]>>;

export type TransformItemFunction<Item> = (o: Record<string, unknown>) => Item;

export class ResultSet<Item> implements Iterable<Item> {
  private readonly result: DuckDbTable;
  private readonly transformItem: TransformItemFunction<Item>;

  constructor(result: DuckDbTable, transformItem: TransformItemFunction<Item>) {
    this.result = result;
    this.transformItem = transformItem;
  }

  *[Symbol.iterator](): Iterator<Item> {
    const rows = this.result.toArray();
    for (const row of rows) {
      yield this.transformItem(row.toJSON());
    }
  }

  toArray(): Item[] {
    return [...this];
  }

  first(): Item {
    return this.toArray()[0];
  }
}
