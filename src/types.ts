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

export interface CreateEventRequest extends express.Request {
  body: {
    data: {
      summary: string
      startDateTime: Date
      endDateTime: Date
    }
  }
}
