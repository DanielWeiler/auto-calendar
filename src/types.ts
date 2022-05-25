import express from 'express'

export interface HttpException extends Error {
  status: number
}

export interface RefreshToken {
  refreshToken: string
  user: string
}

export interface SignInRequest extends express.Request {
  body: {
    code: string
  }
}

export interface EventDisplayData {
  id: string
  title: string | null | undefined
  start: string | null | undefined
  end: string | null | undefined
  extendedProps: object
  backgroundColor: string
  display: string
}

export interface TimePeriod {
  startTime: string
  endTime: string
}

export interface SetWeeklyHoursRequest extends express.Request {
  body: {
    user: string
    data: {
      Monday: TimePeriod
      Tuesday: TimePeriod
      Wednesday: TimePeriod
      Thursday: TimePeriod
      Friday: TimePeriod
      Saturday: TimePeriod
      Sunday: TimePeriod
    }
  }
}

export interface WeeklyHoursData {
  data: {
    Monday: TimePeriod
    Tuesday: TimePeriod
    Wednesday: TimePeriod
    Thursday: TimePeriod
    Friday: TimePeriod
    Saturday: TimePeriod
    Sunday: TimePeriod
  }
}

export interface GetEventsRequest extends express.Request {
  body: {
    user: string
  }
}

export interface CreateEventRequest extends express.Request {
  body: {
    user: string
    data: {
      summary: string
      duration: string
      manualDate: string
      manualTime: string
      minimumStartDate: string
      minimumStartTime: string
      deadlineDate: string
      deadlineTime: string
    }
  }
}

export interface RescheduleEventRequest extends express.Request {
  body: {
    user: string
    data: {
      flexible: boolean
      eventId: string
      rescheduleTime: string
      summary: string
      duration: number
      description: string
      deadline: string
    }
  }
}

export interface DeleteEventRequest extends express.Request {
  body: {
    user: string
    eventId: string
  }
}

export interface EventFormData {
  summary: string
  duration: string
  manualDate: string
  manualTime: string
  minimumStartDate: string
  minimumStartTime: string
  deadlineDate: string
  deadlineTime: string
}

export interface UserMessage {
  eventBeingScheduled: string
  conflictingEvents: string
}

export interface DescriptionInfo {
  schedulingSettings: string | undefined
  deadline: Date | null
  minimumStartTime: Date | null
}

export interface RescheduleData {
  flexible: boolean
  eventId: string
  rescheduleTime: string
  summary: string
  duration: number
  description: string
  deadline: string
}
