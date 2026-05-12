import { redis } from '../config/redis';

const OTP_EXPIRY = 10 * 60; // 10 minutes

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveOtp = async (email: string, otp: string, type: string): Promise<void> => {
  const key = `otp:${type}:${email}`;
  await redis.set(key, otp, 'EX', OTP_EXPIRY);
};

export const verifyOtp = async (email: string, otp: string, type: string): Promise<boolean> => {
  const key = `otp:${type}:${email}`;
  const stored = await redis.get(key);
  if (!stored || stored !== otp) return false;
  await redis.del(key);
  return true;
};