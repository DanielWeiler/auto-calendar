import { NextFunction, Response } from 'express'
import signInService from '../services/sign-in.service'
import { SignInRequest } from '../types'

async function signIn(
  req: SignInRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.send(await signInService.signIn(req.body))
  } catch (error) {
    console.error('Error while signing in')
    next(error)
  }
}

export default { signIn }
