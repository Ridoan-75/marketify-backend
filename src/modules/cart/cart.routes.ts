import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from './cart.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  addToCartSchema,
  updateCartItemSchema,
} from './cart.validation';

const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get('/', getCart);
cartRouter.post('/', validate(addToCartSchema), addToCart);
cartRouter.patch('/:itemId', validate(updateCartItemSchema), updateCartItem);
cartRouter.delete('/:itemId', removeFromCart);
cartRouter.delete('/', clearCart);

export { cartRouter };