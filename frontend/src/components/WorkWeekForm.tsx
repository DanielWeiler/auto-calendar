import axios from 'axios'
import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { WorkingHoursFormValues } from '../types'
import WorkDayForm from './WorkDayForm'

const WorkingHoursForm = () => {
  const { register, handleSubmit } = useForm<WorkingHoursFormValues>({
    defaultValues: {
      Monday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Tuesday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Wednesday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Thursday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Friday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Saturday: {
        startTime: '',
        endTime: '',
      },
      Sunday: {
        startTime: '',
        endTime: '',
      },
    },
  })

  const onSubmit = (data: WorkingHoursFormValues) => {
    console.log(data)

    axios
      .post('/api/events/set-working-hours', { data })
      .then((response) => {
        console.log(response.data)
        console.log('SUCCESS')
      })
      .catch((error) => console.log('ERROR:', error.message))
  }

  return (
    <div>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <WorkDayForm day="Monday" register={register} />
        <WorkDayForm day="Tuesday" register={register} />
        <WorkDayForm day="Wednesday" register={register} />
        <WorkDayForm day="Thursday" register={register} />
        <WorkDayForm day="Friday" register={register} />
        <WorkDayForm day="Saturday" register={register} />
        <WorkDayForm day="Sunday" register={register} />
        <Button
          id="create"
          type="submit"
          /* disabled={submitDisabled} */
          /* style={margin} */
        >
          Save
        </Button>
      </Form>
    </div>
  )
}

export default WorkingHoursForm
