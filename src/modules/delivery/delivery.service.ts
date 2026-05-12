import axios from 'axios';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { env } from '../../config/index';
import { redis } from '../../config/redis';

// ============================================================
// PATHAO
// ============================================================

const PATHAO_TOKEN_KEY = 'pathao:token';

const getPathaoToken = async (): Promise<string> => {
  const cached = await redis.get(PATHAO_TOKEN_KEY);
  if (cached) return cached;

  const response = await axios.post(
    `${env.PATHAO_BASE_URL}/aladdin/api/v1/issue-token`,
    {
      client_id: env.PATHAO_CLIENT_ID,
      client_secret: env.PATHAO_CLIENT_SECRET,
      username: env.PATHAO_USERNAME,
      password: env.PATHAO_PASSWORD,
      grant_type: 'password',
    }
  );

  const token = response.data.access_token;
  const expiresIn = response.data.expires_in ?? 3600;

  await redis.set(PATHAO_TOKEN_KEY, token, 'EX', expiresIn - 60);
  return token;
};

const createPathaoOrder = async (orderItemId: string) => {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: {
        include: {
          address: true,
          user: { select: { name: true, phone: true } },
        },
      },
      product: { select: { name: true, weight: true } },
      seller: { select: { shopName: true, shopAddress: true, shopPhone: true } },
    },
  });

  if (!item) throw new AppError('Order item not found', 404);

  const token = await getPathaoToken();

  const payload = {
    store_id: env.PATHAO_STORE_ID,
    merchant_order_id: orderItemId,
    recipient_name: item.order.address.fullName,
    recipient_phone: item.order.address.phone,
    recipient_address: item.order.address.addressLine1,
    recipient_city: 1, // Dhaka — get city ID from Pathao API
    recipient_zone: 1, // zone ID from Pathao API
    delivery_type: 48, // 48 hours
    item_type: 2, // parcel
    item_quantity: item.quantity,
    item_weight: item.product.weight ?? 0.5,
    item_description: item.product.name,
    amount_to_collect: 0, // prepaid
  };

  const response = await axios.post(
    `${env.PATHAO_BASE_URL}/aladdin/api/v1/orders`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

const trackPathaoOrder = async (trackingId: string) => {
  const token = await getPathaoToken();

  const response = await axios.get(
    `${env.PATHAO_BASE_URL}/aladdin/api/v1/orders/${trackingId}/info`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
};

// ============================================================
// STEADFAST
// ============================================================

const createSteadfastOrder = async (orderItemId: string) => {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: {
        include: {
          address: true,
          user: { select: { name: true, phone: true } },
          payment: true,
        },
      },
      product: { select: { name: true } },
    },
  });

  if (!item) throw new AppError('Order item not found', 404);

  const response = await axios.post(
    `${env.STEADFAST_BASE_URL}/create_order`,
    {
      invoice: orderItemId,
      recipient_name: item.order.address.fullName,
      recipient_phone: item.order.address.phone,
      recipient_address: `${item.order.address.addressLine1}, ${item.order.address.city}`,
      cod_amount: 0, // prepaid
      note: item.product.name,
    },
    {
      headers: {
        'Api-Key': env.STEADFAST_API_KEY,
        'Secret-Key': env.STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

const trackSteadfastOrder = async (trackingId: string) => {
  const response = await axios.get(
    `${env.STEADFAST_BASE_URL}/status_by_trackingcode/${trackingId}`,
    {
      headers: {
        'Api-Key': env.STEADFAST_API_KEY,
        'Secret-Key': env.STEADFAST_SECRET_KEY,
      },
    }
  );

  return response.data;
};

// ============================================================
// SHARED SERVICES
// ============================================================

export const initiateDeliveryService = async (
  orderItemId: string,
  provider: 'PATHAO' | 'STEADFAST',
  sellerId: string
) => {
  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId },
  });
  if (!item) throw new AppError('Order item not found', 404);

  const existingDelivery = await prisma.delivery.findUnique({
    where: { orderItemId },
  });
  if (existingDelivery && existingDelivery.trackingId) {
    throw new AppError('Delivery already initiated', 400);
  }

  let providerResponse: Record<string, unknown>;
  let trackingId: string;
  let trackingUrl: string;

  if (provider === 'PATHAO') {
    providerResponse = await createPathaoOrder(orderItemId);
    trackingId = (providerResponse as any)?.data?.consignment_id as string;
    trackingUrl = `https://steadfast.com.bd/t/${trackingId}`;
  } else {
    providerResponse = await createSteadfastOrder(orderItemId);
    trackingId = (providerResponse as any)?.tracking_code as string;
    trackingUrl = `https://steadfast.com.bd/t/${trackingId}`;
  }

  const delivery = await prisma.delivery.upsert({
    where: { orderItemId },
    create: {
      orderItemId,
      provider,
      trackingId,
      trackingUrl,
      status: 'PICKUP_PENDING',
      providerResponse: providerResponse as any,
    },
    update: {
      provider,
      trackingId,
      trackingUrl,
      status: 'PICKUP_PENDING',
      providerResponse: providerResponse as any,
    },
  });

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status: 'SHIPPED' },
  });

  return delivery;
};

export const trackDeliveryService = async (orderItemId: string, userId: string) => {
  const delivery = await prisma.delivery.findFirst({
    where: {
      orderItemId,
      orderItem: {
        order: { userId },
      },
    },
  });

  if (!delivery) throw new AppError('Delivery not found', 404);
  if (!delivery.trackingId) throw new AppError('Tracking not available yet', 400);

  let trackingData: unknown;

  if (delivery.provider === 'PATHAO') {
    trackingData = await trackPathaoOrder(delivery.trackingId);
  } else {
    trackingData = await trackSteadfastOrder(delivery.trackingId);
  }

  return { delivery, trackingData };
};

export const updateDeliveryStatusService = async (
  orderItemId: string,
  status: string,
  sellerId: string
) => {
  const delivery = await prisma.delivery.findFirst({
    where: { orderItemId, orderItem: { sellerId } },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);

  const updated = await prisma.delivery.update({
    where: { orderItemId },
    data: {
      status: status as any,
      ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
    },
  });

  if (status === 'DELIVERED') {
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: 'DELIVERED' },
    });
  }

  return updated;
};

export const getDeliveryByOrderItemService = async (
  orderItemId: string,
  userId: string
) => {
  const delivery = await prisma.delivery.findFirst({
    where: {
      orderItemId,
      orderItem: { order: { userId } },
    },
  });

  if (!delivery) throw new AppError('Delivery not found', 404);
  return delivery;
};