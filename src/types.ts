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
    clientCurrentDateTime: Date
  }
}

export interface SignInData {
  code: string
  clientCurrentDateTime: Date
}

export interface EventData {
  id: string
  title: string | null | undefined
  start: string | null | undefined
  end: string | null | undefined
  extendedProps: object
  backgroundColor: string
  display: string
}

export interface SetWeeklyHoursRequest extends express.Request {
  body: {
    data: {
      Monday: {
        startTime: string
        endTime: string
      }
      Tuesday: {
        startTime: string
        endTime: string
      }
      Wednesday: {
        startTime: string
        endTime: string
      }
      Thursday: {
        startTime: string
        endTime: string
      }
      Friday: {
        startTime: string
        endTime: string
      }
      Saturday: {
        startTime: string
        endTime: string
      }
      Sunday: {
        startTime: string
        endTime: string
      }
    }
  }
}

export interface WeeklyHoursData {
  data: {
    Monday: {
      startTime: string
      endTime: string
    }
    Tuesday: {
      startTime: string
      endTime: string
    }
    Wednesday: {
      startTime: string
      endTime: string
    }
    Thursday: {
      startTime: string
      endTime: string
    }
    Friday: {
      startTime: string
      endTime: string
    }
    Saturday: {
      startTime: string
      endTime: string
    }
    Sunday: {
      startTime: string
      endTime: string
    }
  }
}

export interface CreateEventRequest extends express.Request {
  body: {
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
    flexible: boolean
    eventId: string
    rescheduleTime: string
    summary: string
    duration: number
    description: string
    deadline: string
  }
}

export interface DeleteEventRequest extends express.Request {
  body: {
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
