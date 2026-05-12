import { Router } from 'express';
import {
  initiateDelivery,
  trackDelivery,
  updateDeliveryStatus,
  getDeliveryByOrderItem,
} from './delivery.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const deliveryRouter = Router();

deliveryRouter.use(authenticate);

deliveryRouter.post('/initiate', authorize('SELLER'), initiateDelivery);
deliveryRouter.patch('/:orderItemId/status', authorize('SELLER'), updateDeliveryStatus);
deliveryRouter.get('/:orderItemId/track', trackDelivery);
deliveryRouter.get('/:orderItemId', getDeliveryByOrderItem);

export { deliveryRouter };