import { Alert, AlertColor, AlertTitle } from '@mui/material'
import React from 'react'
import { NotificationDetails } from '../types'

const Notification = (props: {
  notification: NotificationDetails
  createNotification: (
    body: string,
    heading: string,
    style: AlertColor | undefined
  ) => void
}) => {
  const { notification, createNotification } = props
  const { style, heading, body } = notification

  if (heading === '') {
    return null
  }

  return (
    <Alert
      severity={style}
      onClose={() => {
        createNotification('', '', undefined)
      }}
    >
      <AlertTitle>{heading}</AlertTitle>
      {body}
    </Alert>
  )
}

export default Notification
