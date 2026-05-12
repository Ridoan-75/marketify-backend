import { z } from 'zod';

export const stripeIntentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const sslcommerzInitSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const bkashInitSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    transactionId: z.string().min(1, 'Transaction ID is required'),
  }),
});