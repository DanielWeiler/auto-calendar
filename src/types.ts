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
      Mo: {
        startTime: string
        endTime: string
      }
      Tu: {
        startTime: string
        endTime: string
      }
      We: {
        startTime: string
        endTime: string
      }
      Th: {
        startTime: string
        endTime: string
      }
      Fr: {
        startTime: string
        endTime: string
      }
      Sa: {
        startTime: string
        endTime: string
      }
      Su: {
        startTime: string
        endTime: string
      }
    }
  }
}
