import { Input } from '@mui/material'
import React from 'react'

const WeekDayForm = (props: {
  day: string
  display: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
}) => {
  const { day, display, register, error } = props

  return (
    <div style={{ display: display }}>
      <label id="dayName" className="week-day-label">
        {day}
      </label>
      <span>
        <Input
          id="startTime"
          type="time"
          size="small"
          className="week-day-time"
          {...register(`${day}.startTime`)}
        />
        <span style={{ padding: '8px' }}>{' — '}</span>
        <Input
          id="endTime"
          type="time"
          size="small"
          className="week-day-time"
          {...register(`${day}.endTime`)}
        />
      </span>
      <p style={{ color: 'red' }}>
        {error?.startTime?.message || error?.endTime?.message}
      </p>
    </div>
  )
}
export default WeekDayForm
