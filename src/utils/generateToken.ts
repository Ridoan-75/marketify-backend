import jwt from 'jsonwebtoken';
import { env } from '../config/index';

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (
  token: string
): { userId: string; role: string } => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as {
    userId: string;
    role: string;
  };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
};