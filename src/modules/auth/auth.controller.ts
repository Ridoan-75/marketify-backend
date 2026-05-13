import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/sendResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  firebaseLoginService,
  refreshTokenService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
} from './auth.service';

// Firebase login/register (Google, Facebook, Email - sob ekhanei)
export const firebaseLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await firebaseLoginService(req.body);
  sendResponse({ res, statusCode: 200, message: 'Login successful.', data: result });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return sendResponse({ res, statusCode: 400, success: false, message: 'Refresh token required.' });
  }
  const tokens = await refreshTokenService(refreshToken);
  sendResponse({ res, message: 'Token refreshed.', data: tokens });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await logoutService(req.user!.id);
  sendResponse({ res, message: 'Logged out successfully.' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await forgotPasswordService(req.body);
  sendResponse({ res, message: 'Password reset OTP sent to your email.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await resetPasswordService(req.body);
  sendResponse({ res, message: 'Password reset successfully.' });
});