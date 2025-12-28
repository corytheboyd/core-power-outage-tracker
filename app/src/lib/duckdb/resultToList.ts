export function resultToList<T = object>(result: unknown): T[] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return result.toArray().map(row => row.toJSON() as T)
}
