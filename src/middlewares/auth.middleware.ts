import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/generateToken';
import { AppError } from '../errors/AppError';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, isActive: true, isBanned: true },
    });

    if (!user) throw new AppError('User not found', 401);
    if (!user.isActive) throw new AppError('Account is deactivated', 401);
    if (user.isBanned) throw new AppError('Account is banned', 403);

    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
};