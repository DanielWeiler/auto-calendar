import React from 'react'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'

interface ReminderFormValues {
  summary: string
  startDateTime: Date
  endDateTime: Date
}

const ReminderForm = () => {
  const { register, handleSubmit } = useForm<ReminderFormValues>()

  const onSubmit = (data: ReminderFormValues) => {
    eventService.createReminder('/create-event', { data })
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register('summary' /* { required: true } */)}
          placeholder="summary"
        />
        <input
          type="datetime-local"
          {...register('startDateTime' /* { required: true } */)}
          placeholder="start date time"
        />
        {/* maybe do not need end just put default that is not used */}
        <input
          type="datetime-local"
          {...register('endDateTime' /* { required: true } */)}
          placeholder="end date time"
        />
        <input type="submit" />
      </form>
    </div>
  )
}

export default ReminderForm
