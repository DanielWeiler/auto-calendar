import { Response } from 'express'
import signInService from '../services/sign-in.service'
import { SignInRequest } from '../types'

function signIn(req: SignInRequest, _res: Response) {
  signInService.signIn(req.body)
}

export default { signIn }
