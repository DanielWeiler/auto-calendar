import { NextFunction, Response } from 'express'
import signInService from '../services/sign-in.service'
import { SignInRequest } from '../types'

function signIn(req: SignInRequest, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      res.send(await signInService.signIn(req.body.code))
    } catch (error) {
      console.error('Error while signing in')
      next(error)
    }
  })()
}

export default { signIn }
