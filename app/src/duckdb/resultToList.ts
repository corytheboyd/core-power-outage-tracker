export function resultToList<T>(result: unknown): T[] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return result.toArray().map((row: T) => row.toJSON())
}
