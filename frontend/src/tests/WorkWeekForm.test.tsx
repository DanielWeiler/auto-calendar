import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'
import React from 'react'
import WorkDayForm from '../components/WeekDayForm'
import WorkingHoursForm from '../components/WorkWeekForm'
import { assertDefined } from '../utils/helpers'

describe('WorkingHoursForm', () => {
  let component: RenderResult<
    typeof import('@testing-library/dom/types/queries'),
    HTMLElement
  > | null = null

  let innerComponent: RenderResult<
    typeof import('@testing-library/dom/types/queries'),
    HTMLElement
  > | null = null

  const mockRegister = jest.fn()
  const mockError = {
    type: '',
    message: '',
  }

  beforeEach(() => {
    component = render(<WorkingHoursForm />)
    innerComponent = render(
      <WorkDayForm
        day='(weekDayName)'
        display=''
        register={mockRegister}
        error={mockError}
      />
    )
  })

  test('should render its elements', () => {
    assertDefined(component)
    expect(component.container.querySelector('form')).toBeInTheDocument()
    expect(component.container.querySelector('#save')).toBeInTheDocument()

    assertDefined(innerComponent)
    expect(
      innerComponent.container.querySelector('#dayName')
    ).toBeInTheDocument()
    expect(
      innerComponent.container.querySelector('#startTime')
    ).toBeInTheDocument()
    expect(
      innerComponent.container.querySelector('#endTime')
    ).toBeInTheDocument()
  })

  test('should register a start time and an end time for a work day', () => {
    expect(mockRegister).toHaveReturnedTimes(2)
  })
})
