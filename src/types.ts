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
    userCurrentDateTime: string
  }
}

export interface CreateEventRequest extends express.Request {
  body: {
    data: {
      summary: string
      startDateTime: Date
      endDateTime: Date
    }
  }
}

export interface SetWorkingHoursRequest extends express.Request {
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
