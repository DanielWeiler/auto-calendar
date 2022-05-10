/**
 * Adds the given time to the given date.
 * @param {string} time - A time in the format "hh:mm"
 * @param {Date | string} date - A Date object or a string representing a Date
 * object
 * @returns {Date} Returns the new Date object.
 */
export function addTimeToDate(time: string, date: Date | string): Date {
  const dateTime = new Date(date)
  const t = parseTime(time)
  dateTime.setHours(t.hours, t.minutes)
  return dateTime
}

/**
 * Parses the given time string into hours and minutes.
 * @param {string} time - A time in the format "hh:mm"
 * @returns {{ hours: number; minutes: number }} Returns an object containing
 * the hours and minutes of the given time.
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const h = time.split(':')[0]
  const m = time.split(':')[1]

  const hours = Number(h)
  const minutes = Number(m)
  const t = { hours, minutes }

  return t
}

/**
 * Asserts that the given value is not null or undefined. If the value is
 * indeed null or undefined then it throws an error.
 * @param {T | null | undefined} value - 
 */
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
  'Another manually scheduled event is scheduled during this time.',
  'This event was scheduled during working hours.',
  'This event was scheduled outside of available hours.',
]
