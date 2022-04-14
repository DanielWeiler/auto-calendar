import React from 'react'
import { Alert } from 'react-bootstrap'
import { serverErrorMessage, warningMessages } from '../utils/helpers'

const Notification = (props: { message: string }) => {
  let { message } = props

  if (message === '') {
    return null
  }

  // Text that is unnecessary for the user is removed
  if (message.includes('Manually scheduled')) {
    message = message.substring(18)
  }

  const newNotification = {
    style: 'success',
    heading: 'Reminder scheduled',
    body: message,
  }

  if (warningMessages.map((warning) => message === warning)) {
    newNotification.style = 'warning'
    newNotification.heading = 'Reminder scheduled with conflicts'
  } else if (
    message.includes(
      'There was no time slot available for this event before its deadline.'
    )
  ) {
    newNotification.style = 'danger'
    newNotification.heading = 'Reminder was not scheduled'
  } else if (message.includes(serverErrorMessage)) {
    newNotification.style = 'danger'
    newNotification.heading = '500 Internal Server Error'
  }

  return (
    <Alert variant={newNotification.style}>
      <Alert.Heading>{newNotification.heading}</Alert.Heading>
      <p>{newNotification.body}</p>
    </Alert>
  )
}

export default Notification
