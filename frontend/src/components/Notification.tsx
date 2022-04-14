import React from 'react'
import { Alert } from 'react-bootstrap'
import { NotificationDetails } from '../types'

const Notification = (props: { notification: NotificationDetails }) => {
  const { notification } = props
  const { style, heading, body } = notification

  if (heading === '') {
    return null
  }

  return (
    <Alert variant={style}>
      <Alert.Heading>{heading}</Alert.Heading>
      <p>{body}</p>
    </Alert>
  )
}

export default Notification
