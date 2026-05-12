import { Response } from 'express';

interface Meta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

interface SendResponseOptions<T> {
  res: Response;
  statusCode?: number;
  success?: boolean;
  message: string;
  data?: T;
  meta?: Meta;
}

export const sendResponse = <T>({
  res,
  statusCode = 200,
  success = true,
  message,
  data,
  meta,
}: SendResponseOptions<T>): void => {
  res.status(statusCode).json({
    success,
    message,
    data: data ?? null,
    meta: meta ?? null,
  });
};