import type {
  AsyncDuckDBConnection,
  AsyncPreparedStatement,
} from "@duckdb/duckdb-wasm";
import { ResultSet } from "./ResultSet.ts";
import type { SqlPrimitive } from "../types/app";

export class DuckDbQuery<
  Args extends Record<string, SqlPrimitive>,
  Result = void,
> {
  private readonly statement: AsyncPreparedStatement;
  private readonly paramOrder: ReadonlyArray<keyof Args>;
  private readonly sql: string;

  private constructor(
    statement: AsyncPreparedStatement,
    paramOrder: ReadonlyArray<keyof Args>,
    sql: string,
  ) {
    this.statement = statement;
    this.paramOrder = paramOrder;
    this.sql = sql;
  }

  // With parameters
  public static async build<
    Args extends Record<string, SqlPrimitive>,
    Result = void,
  >(
    connection: AsyncDuckDBConnection,
    sql: string,
    paramOrder: ReadonlyArray<keyof Args>,
  ): Promise<DuckDbQuery<Args, Result>>;

  // Without parameters
  public static async build<Result = void>(
    connection: AsyncDuckDBConnection,
    sql: string,
  ): Promise<DuckDbQuery<Record<string, never>, Result>>;

  // Implementation
  public static async build<
    Args extends Record<string, SqlPrimitive>,
    Result = void,
  >(
    connection: AsyncDuckDBConnection,
    sql: string,
    paramOrder?: ReadonlyArray<keyof Args>,
  ): Promise<DuckDbQuery<Args, Result>> {
    const statement = await connection.prepare(sql);
    return new this(statement, paramOrder || [], sql);
  }

  public async query(args: Args): Promise<ResultSet<Result>> {
    const startTime = performance.now();

    if (this.paramOrder.length === 0) {
      const result = await this.statement.query();
      return new ResultSet<Result>(result);
    }
    const orderedValues = this.paramOrder.map((key) => args[key]);
    const result = await this.statement.query(...orderedValues);
    const rs = new ResultSet<Result>(result);

    const elapsedTime = performance.now() - startTime;
    console.debug(
      `Query executed in ${elapsedTime} ms`,
      this.sql,
      args,
      rs.toArray(),
    );

    return rs;
  }

  public async teardown() {
    await this.statement.close();
  }
}
