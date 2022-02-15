import React from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'

interface ReminderFormValues {
  summary: string
  startDateTime: Date
  endDateTime: Date
}

const ReminderForm = () => {
  const { register, handleSubmit } = useForm<ReminderFormValues>()

  const onSubmit = (data: ReminderFormValues) => {
    axios
      .post('/api/events/create-event', { data })
      .then((response) => {
        console.log(response.data)
        console.log('SUCCESS')
      })
      .catch((error) => console.log('ERROR:', error.message))
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register('summary', { required: true })}
          placeholder="summary"
        />
        <input
          type="datetime-local"
          {...register('startDateTime', { required: true })}
          placeholder="start date time"
        />
        {/* maybe do not need end just put default that is not used */}
        <input
          type="datetime-local"
          {...register('endDateTime', { required: true })}
          placeholder="end date time"
        />
        <input type="submit" />
      </form>
    </div>
  )
}

export default ReminderForm
