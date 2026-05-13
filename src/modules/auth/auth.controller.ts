import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  registerService,
  verifyEmailService,
  resendOtpService,
  loginService,
  refreshTokenService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
  socialLoginService,
} from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerService(req.body);
  sendResponse({
    res,
    statusCode: 201,
    message: "Registration successful. Please check your email for the OTP.",
    data: user,
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await verifyEmailService(req.body);
  sendResponse({ res, message: "Email verified successfully." });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  await resendOtpService(req.body.email);
  sendResponse({ res, message: "OTP resent successfully." });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginService(req.body);
  sendResponse({ res, message: "Login successful.", data: result });
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Refresh token required.",
      });
    }
    const tokens = await refreshTokenService(refreshToken);
    sendResponse({ res, message: "Token refreshed.", data: tokens });
  },
);

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await logoutService(req.user!.id);
  sendResponse({ res, message: "Logged out successfully." });
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    await forgotPasswordService(req.body);
    sendResponse({ res, message: "Password reset OTP sent to your email." });
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    await resetPasswordService(req.body);
    sendResponse({ res, message: "Password reset successfully." });
  },
);


export const socialLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await socialLoginService(req.body);
  sendResponse({ res, message: 'Login successful.', data: result });
});