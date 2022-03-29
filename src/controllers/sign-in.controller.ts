import { Response } from 'express'
import signInService from '../services/sign-in.service'
import { SignInRequest } from '../types'

async function signIn(req: SignInRequest, _res: Response) {
  await signInService.signIn(req.body)
}

export default { signIn }
