import { Alert, AlertTitle } from '@mui/material'
import React from 'react'
import { NotificationDetails } from '../types'

const Notification = (props: { notification: NotificationDetails }) => {
  const { notification } = props
  const { style, heading, body } = notification

  if (heading === '') {
    return null
  }

  return (
    <Alert severity={style}>
      <AlertTitle>{heading}</AlertTitle>
      {body}
    </Alert>
  )
}

export default Notification
