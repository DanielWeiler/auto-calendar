import axios from 'axios'

export function assertDefined<T>(
  value: T | null | undefined
): asserts value is T {
  if (value == null) {
    throw new Error(`Fatal error: value ${value} must not be null/undefined.`)
  }
}

export function getUserCurrentDateTime() {
  const userCurrentDateTime = new Date()

  axios
    .post('/api/events', { userCurrentDateTime })
    .then((response) => {
      console.log(response.data)
    })
    .catch((error) => console.log(error.message))
}
