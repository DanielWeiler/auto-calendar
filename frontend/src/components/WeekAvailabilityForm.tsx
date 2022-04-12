import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { TimePeriod, WeeklyHoursFormValues } from '../types'
import WeekDayForm from './WeekDayForm'

const WeekAvailabilityForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<WeeklyHoursFormValues>({
    defaultValues: {
      Monday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Tuesday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Wednesday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Thursday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Friday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Saturday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Sunday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
    },
  })

  const onSubmit = async (daysData: WeeklyHoursFormValues) => {
    let error = false
    Object.keys(daysData).forEach((day: string) => {
      if (
        !daysData[day as keyof WeeklyHoursFormValues].startTime !==
        !daysData[day as keyof WeeklyHoursFormValues].endTime
      ) {
        Object.keys(daysData[day as keyof WeeklyHoursFormValues]).forEach(
          (time) => {
            !daysData[day as keyof WeeklyHoursFormValues][
              time as keyof TimePeriod
            ] &&
              setError(
                `${day as keyof WeeklyHoursFormValues}.${
                  time as keyof TimePeriod
                }`,
                {
                  type: 'required',
                  message: `${
                    time === 'startTime' ? 'A start' : 'An end'
                  } time is needed for the given ${
                    time === 'startTime' ? 'end' : 'start'
                  } time`,
                }
              )
            error = true
          }
        )
      } else if (
        daysData[day as keyof WeeklyHoursFormValues].startTime >
        daysData[day as keyof WeeklyHoursFormValues].endTime
      ) {
        setError(`${day as keyof WeeklyHoursFormValues}.endTime`, {
          type: 'required',
          message: 'Start time must be before end time',
        })
        error = true
      }
    })

    if (error) {
      return
    }

    try {
      await eventService.setUnavailableHours('/set-unavailable-hours', {
        daysData,
      })
    } catch (error) {
      console.log(
        '500 Internal Server Error \n Oh no! Something bad happened. Please',
        'come back later when we have fixed this problem. Thanks.'
      )
    }
  }

  return (
    <div>
      <Form onSubmit={handleSubmit(onSubmit)}>
        {[
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ].map((day) => (
          <WeekDayForm
            key={day}
            day={day}
            register={register}
            error={errors[day as keyof WeeklyHoursFormValues]}
          />
        ))}

        <Button
          id="save"
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

export default WeekAvailabilityForm
