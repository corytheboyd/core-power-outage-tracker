export function resultToList(result: unknown): object[] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return result.toArray().map(row => row.toJSON())
}
