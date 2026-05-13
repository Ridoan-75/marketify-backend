import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/generateToken';
import { sendEmail } from '../../utils/sendEmail';
import { generateOtp, saveOtp, verifyOtp } from '../../utils/otp';
import { verifyEmailTemplate, resetPasswordTemplate } from '../../utils/emailTemplate';
import { redis } from '../../config/redis';
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validation';

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

export const registerService = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const otp = generateOtp();
  await saveOtp(data.email, otp, 'verify_email');
  await sendEmail({
    to: data.email,
    subject: 'Verify your Marketify account',
    html: verifyEmailTemplate(data.name, otp),
  });

  return user;
};

export const verifyEmailService = async (data: VerifyEmailInput) => {
  const isValid = await verifyOtp(data.email, data.otp, 'verify_email');
  if (!isValid) throw new AppError('Invalid or expired OTP', 400);

  await prisma.user.update({
    where: { email: data.email },
    data: { isEmailVerified: true },
  });

  return true;
};

export const resendOtpService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);
  if (user.isEmailVerified) throw new AppError('Email already verified', 400);

  const otp = generateOtp();
  await saveOtp(email, otp, 'verify_email');
  await sendEmail({
    to: email,
    subject: 'Verify your Marketify account',
    html: verifyEmailTemplate(user.name, otp),
  });

  return true;
};

export const loginService = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.password) throw new AppError('Invalid email or password', 401);
  if (user.isBanned) throw new AppError('Your account has been banned', 403);
  if (!user.isEmailVerified) throw new AppError('Please verify your email first', 401);

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // save refresh token in redis
  await redis.set(`refresh:${user.id}`, refreshToken, 'EX', REFRESH_TOKEN_EXPIRY);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshTokenService = async (token: string) => {
  let decoded: { userId: string };

  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await redis.get(`refresh:${decoded.userId}`);
  if (!stored || stored !== token) throw new AppError('Refresh token revoked', 401);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, isActive: true, isBanned: true },
  });

  if (!user) throw new AppError('User not found', 401);
  if (!user.isActive || user.isBanned) throw new AppError('Account is not active', 403);

  const accessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  await redis.set(`refresh:${user.id}`, newRefreshToken, 'EX', REFRESH_TOKEN_EXPIRY);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutService = async (userId: string) => {
  await redis.del(`refresh:${userId}`);
  return true;
};

export const forgotPasswordService = async (data: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError('No account found with this email', 404);

  const otp = generateOtp();
  await saveOtp(data.email, otp, 'reset_password');
  await sendEmail({
    to: data.email,
    subject: 'Reset your Marketify password',
    html: resetPasswordTemplate(user.name, otp),
  });

  return true;
};

export const resetPasswordService = async (data: ResetPasswordInput) => {
  const isValid = await verifyOtp(data.email, data.otp, 'reset_password');
  if (!isValid) throw new AppError('Invalid or expired OTP', 400);

  const hashedPassword = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { email: data.email },
    data: { password: hashedPassword },
  });

  return true;
};

export const socialLoginService = async (data: {
  name: string;
  email: string;
  avatar?: string;
  provider: 'GOOGLE' | 'FACEBOOK';
}) => {
  let user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        provider: data.provider === 'GOOGLE' ? 'GOOGLE' : 'EMAIL',
        isEmailVerified: true,
        isActive: true,
      },
    });
  }

  if (user.isBanned) throw new AppError('Your account has been banned', 403);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await redis.set(
    `refresh:${user.id}`,
    refreshToken,
    'EX',
    7 * 24 * 60 * 60
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  };
};