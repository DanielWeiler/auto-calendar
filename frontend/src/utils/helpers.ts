export function addTimeToDate(time: string, date: Date | string): Date {
  const dateTime = new Date(date)
  const t = parseTime(time)
  dateTime.setHours(t.hours, t.minutes)
  return dateTime
}

export function parseTime(time: string): { hours: number; minutes: number } {
  const h = time.split(':')[0]
  const m = time.split(':')[1]

  const hours = Number(h)
  const minutes = Number(m)
  const t = { hours, minutes }

  return t
}

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
  'One or more conflicting events could not be rescheduled before their deadline. These events were not changed.',
  'Another manually scheduled reminder is scheduled during this time.',
  'This reminder was scheduled during working hours.',
  'This reminder was scheduled outside of available hours.',
]
