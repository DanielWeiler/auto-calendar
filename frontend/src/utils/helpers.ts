export function assertDefined<T>(
  value: T | null | undefined
): asserts value is T {
  if (value == null) {
    throw new Error(`Fatal error: value ${value} must not be null/undefined.`)
  }
}

export const serverErrorMessage =
  'Oh no! Something bad happened. Please come back later when we have fixed ' +
  'this problem. Thanks.'

export const warningMessages = [
  'One or more conflicting events could not be rescheduled before their deadline.',
]
