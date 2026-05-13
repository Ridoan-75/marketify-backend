import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/generateToken';
import { redis } from '../../config/redis';
import { admin } from '../../config/firebase';
import { FirebaseLoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validation';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../utils/sendEmail';
import { generateOtp, saveOtp, verifyOtp } from '../../utils/otp';
import { resetPasswordTemplate } from '../../utils/emailTemplate';

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

// Firebase token verify kore DB te user sync korbe
export const firebaseLoginService = async (data: FirebaseLoginInput) => {
  // Firebase token verify
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(data.firebaseToken);
  } catch {
    throw new AppError('Invalid Firebase token', 401);
  }

  const { uid, email, name, picture, firebase } = decoded;
  const providerRaw = firebase?.sign_in_provider;

  // Provider determine
  let provider: 'GOOGLE' | 'FACEBOOK' | 'EMAIL' = 'EMAIL';
  if (providerRaw === 'google.com') provider = 'GOOGLE';
  else if (providerRaw === 'facebook.com') provider = 'FACEBOOK';

  if (!email) throw new AppError('Email not found from Firebase', 400);

  // User already ache kina check (firebaseUid diye)
  let user = await prisma.user.findUnique({ where: { firebaseUid: uid } });

  if (!user) {
    // Email diye check (already registered thakle link kore dao)
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Existing user e firebaseUid link kore dao
      user = await prisma.user.update({
        where: { email },
        data: {
          firebaseUid: uid,
          provider,
          isEmailVerified: true,
          avatar: user.avatar ?? picture ?? null,
        },
      });
    } else {
      // Notun user create
      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          name: name ?? email.split('@')[0],
          email,
          avatar: picture ?? null,
          provider,
          isEmailVerified: true,
          isActive: true,
        },
      });
    }
  }

  if (user.isBanned) throw new AppError('Your account has been banned', 403);
  if (!user.isActive) throw new AppError('Your account is not active', 403);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await redis.set(`refresh:${user.id}`, refreshToken, 'EX', REFRESH_TOKEN_EXPIRY);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
    },
    accessToken,
    refreshToken,
  };
};

// Email/password - shudhu OTP verify korbe (Firebase already register korche)
export const verifyEmailService = async (email: string, otp: string) => {
  const isValid = await verifyOtp(email, otp, 'verify_email');
  if (!isValid) throw new AppError('Invalid or expired OTP', 400);

  await prisma.user.update({
    where: { email },
    data: { isEmailVerified: true },
  });

  return true;
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
  if (user.provider !== 'EMAIL') throw new AppError('Social login account. Password reset not applicable.', 400);

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

  // Firebase e password update
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user?.firebaseUid) throw new AppError('User not found', 404);

  await admin.auth().updateUser(user.firebaseUid, {
    password: data.newPassword,
  });

  return true;
};