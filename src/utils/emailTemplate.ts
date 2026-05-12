export const verifyEmailTemplate = (name: string, otp: string): string => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #111827;">Welcome to Marketify, ${name}</h2>
    <p style="color: #6b7280;">Use the OTP below to verify your email address. It expires in 10 minutes.</p>
    <div style="background: #f3f4f6; border-radius: 6px; padding: 16px 24px; text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
    </div>
    <p style="color: #9ca3af; font-size: 13px;">If you did not create an account, please ignore this email.</p>
  </div>
`;

export const resetPasswordTemplate = (name: string, otp: string): string => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #111827;">Password Reset Request</h2>
    <p style="color: #6b7280;">Hi ${name}, use the OTP below to reset your password. It expires in 10 minutes.</p>
    <div style="background: #f3f4f6; border-radius: 6px; padding: 16px 24px; text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
    </div>
    <p style="color: #9ca3af; font-size: 13px;">If you did not request a password reset, please ignore this email.</p>
  </div>
`;
