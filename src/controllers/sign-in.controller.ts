/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Response } from 'express'
import signInService from '../services/sign-in.service'
import { SignInRequest } from '../types'

function signIn(req: SignInRequest, res: Response, next: NextFunction): void {
  try {
    res.json(signInService.signIn(req.body))
  } catch (error: any) {
    console.error(`Error while signing in`, error.message)
    next(error)
  }
}

export default { signIn }
