import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import WorkDayForm from '../components/WeekDayForm'
import WorkWeekForm from '../components/WorkWeekForm'

describe('WorkWeekForm', () => {
  const mockCreateNotification = jest.fn()
  const mockRegister = jest.fn()
  const mockError = {
    type: '',
    message: '',
  }

  test('should render its elements', () => {
    const workWeekForm = render(
      <WorkWeekForm createNotification={mockCreateNotification} />,
      { wrapper: MemoryRouter }
    )

    // Check for the week day selectors
    expect(workWeekForm.getByRole('checkbox', { name: 'M' }))
    // Get the name for Tuesday and Thursday
    expect(workWeekForm.getAllByRole('checkbox', { name: 'T' }))
    expect(workWeekForm.getByRole('checkbox', { name: 'W' }))
    expect(workWeekForm.getByRole('checkbox', { name: 'F' }))
    // Get the name for Saturday and Sunday
    expect(workWeekForm.getAllByRole('checkbox', { name: 'S' }))
    expect(workWeekForm.getByText('Save'))

    // Check for the week day labels
    expect(workWeekForm.getByText('Monday'))
    expect(workWeekForm.getByText('Tuesday'))
    expect(workWeekForm.getByText('Wednesday'))
    expect(workWeekForm.getByText('Thursday'))
    expect(workWeekForm.getByText('Friday'))
    expect(workWeekForm.getByText('Saturday'))
    expect(workWeekForm.getByText('Sunday'))
  })

  test('should register a start time and an end time for a work day', () => {
    const workDayForm = render(
      <WorkDayForm
        day="(weekDayName)"
        display=""
        register={mockRegister}
        error={mockError}
      />
    )

    // Check for the work day's elements and that the times are registered
    expect(workDayForm.container.querySelector('#dayName')).toBeInTheDocument()
    expect(
      workDayForm.container.querySelector('#startTime')
    ).toBeInTheDocument()
    expect(workDayForm.container.querySelector('#endTime')).toBeInTheDocument()
    expect(mockRegister).toHaveReturnedTimes(2)
  })
})
