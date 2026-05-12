import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';

const generateMockTracking = () => {
  const id = `MKT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    trackingId: id,
    trackingUrl: `https://mock-tracking.marketify.com/${id}`,
  };
};

export const initiateDeliveryService = async (
  orderItemId: string,
  sellerId: string
) => {
  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId },
  });
  if (!item) throw new AppError('Order item not found', 404);

  const existing = await prisma.delivery.findUnique({ where: { orderItemId } });
  if (existing?.trackingId) throw new AppError('Delivery already initiated', 400);

  const { trackingId, trackingUrl } = generateMockTracking();

  const delivery = await prisma.delivery.upsert({
    where: { orderItemId },
    create: {
      orderItemId,
      provider: 'MANUAL',
      trackingId,
      trackingUrl,
      status: 'PICKUP_PENDING',
      providerResponse: { mock: true },
    },
    update: {
      provider: 'MANUAL',
      trackingId,
      trackingUrl,
      status: 'PICKUP_PENDING',
      providerResponse: { mock: true },
    },
  });

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status: 'SHIPPED' },
  });

  return delivery;
};

export const trackDeliveryService = async (
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
  if (!delivery.trackingId) throw new AppError('Tracking not available yet', 400);

  return {
    delivery,
    trackingData: {
      trackingId: delivery.trackingId,
      trackingUrl: delivery.trackingUrl,
      status: delivery.status,
      estimatedDate: delivery.estimatedDate,
      deliveredAt: delivery.deliveredAt,
    },
  };
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