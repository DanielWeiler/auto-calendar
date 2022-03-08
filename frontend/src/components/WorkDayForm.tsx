import React from 'react'
import { Form } from 'react-bootstrap'

const WorkDayForm = (props: {
  day: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
}) => {
  const { day, register } = props

  return (
    <div>
      <Form.Label id="dayName">{day}</Form.Label>
      <Form.Control id="startTime" type="time" {...register(`${day}.startTime`)} />
      <Form.Control id="endTime" type="time" {...register(`${day}.endTime`)} />
    </div>
  )
}
export default WorkDayForm
