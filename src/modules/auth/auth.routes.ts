import { Router } from "express";
import {
  register,
  verifyEmail,
  resendOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  socialLogin,
} from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  registerSchema,
  verifyEmailSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
authRouter.post("/resend-otp", validate(resendOtpSchema), resendOtp);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", authenticate, logout);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword,
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword,
);

authRouter.post('/social', socialLogin);

export { authRouter };
