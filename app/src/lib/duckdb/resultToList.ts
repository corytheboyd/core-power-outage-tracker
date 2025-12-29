export function resultToList<T = never, R = object>(result: unknown): T[] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return result.toArray().map((row: R) => row.toJSON() as T)
}
