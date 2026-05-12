import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { userRouter } from '../modules/user/user.routes';
import { sellerRouter } from '../modules/seller/seller.routes';
import { categoryRouter } from '../modules/category/category.routes';
import { productRouter } from '../modules/product/product.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/seller', sellerRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);

export { router };