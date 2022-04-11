import React from 'react'
import { Form } from 'react-bootstrap'

const WeekDayForm = (props: {
  day: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
}) => {
  const { day, register, error } = props

  return (
    <div>
      <Form.Label id="dayName">{day}</Form.Label>
      <Form.Control id="startTime" type="time" {...register(`${day}.startTime`)} />
      <Form.Control id="endTime" type="time" {...register(`${day}.endTime`)} />
      <p style={{ color: 'red' }}>{error?.startTime?.message || error?.endTime?.message}</p>
    </div>
  )
}
export default WeekDayForm
