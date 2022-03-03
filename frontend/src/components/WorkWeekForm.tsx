import axios from 'axios'
import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { WorkingHoursFormValues } from '../types'
import WorkDayForm from './WorkDayForm'

const WorkingHoursForm = () => {
  const { register, handleSubmit } = useForm<WorkingHoursFormValues>({
    defaultValues: {
      Mo: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Tu: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      We: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Th: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Fr: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Sa: {
        startTime: '',
        endTime: '',
      },
      Su: {
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
        <WorkDayForm day="Mo" register={register} />
        <WorkDayForm day="Tu" register={register} />
        <WorkDayForm day="We" register={register} />
        <WorkDayForm day="Th" register={register} />
        <WorkDayForm day="Fr" register={register} />
        <WorkDayForm day="Sa" register={register} />
        <WorkDayForm day="Su" register={register} />
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
