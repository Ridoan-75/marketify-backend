import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { userRouter } from '../modules/user/user.routes';
import { sellerRouter } from '../modules/seller/seller.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/seller', sellerRouter);

export { router };