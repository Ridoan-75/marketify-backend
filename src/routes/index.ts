import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { userRouter } from '../modules/user/user.routes';
import { sellerRouter } from '../modules/seller/seller.routes';
import { categoryRouter } from '../modules/category/category.routes';
import { productRouter } from '../modules/product/product.routes';
import { cartRouter } from '../modules/cart/cart.routes';
import { orderRouter } from '../modules/order/order.routes';
import { reviewRouter } from '../modules/review/review.routes';
import { wishlistRouter } from '../modules/wishlist/wishlist.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import { notificationRouter } from '../modules/notification/notification.routes';
import { paymentRouter } from '../modules/payment/payment.routes';
import { aiRouter } from '../modules/ai/ai.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/seller', sellerRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/reviews', reviewRouter);
router.use('/wishlist', wishlistRouter);
router.use('/admin', adminRouter);
router.use('/notifications', notificationRouter);
router.use('/payment', paymentRouter);
router.use('/ai', aiRouter);


export { router };