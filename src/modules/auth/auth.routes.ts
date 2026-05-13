import { Router } from 'express';
import {
  firebaseLogin,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  firebaseLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

const authRouter = Router();

// Single endpoint - Firebase token pathabo, backend verify korbe
authRouter.post('/login', validate(firebaseLoginSchema), firebaseLogin);

authRouter.post('/refresh-token', refreshToken);
authRouter.post('/logout', authenticate, logout);
authRouter.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export { authRouter };