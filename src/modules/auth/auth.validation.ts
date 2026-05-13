import { z } from 'zod';

// Frontend Firebase token pathabe - ekta e endpoint
export const firebaseLoginSchema = z.object({
  body: z.object({
    firebaseToken: z.string().min(1, 'Firebase token is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
  }),
});

export type FirebaseLoginInput = z.infer<typeof firebaseLoginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];