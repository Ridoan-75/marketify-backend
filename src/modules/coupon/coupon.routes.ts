import { Router } from "express";
import {
  createCoupon,
  getMyCoupons,
  updateCoupon,
  deleteCoupon,
} from "./coupon.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createCouponSchema, updateCouponSchema } from "./coupon.validation";

const couponRouter = Router();

couponRouter.use(authenticate);

couponRouter.get("/", authorize("SELLER", "ADMIN"), getMyCoupons);
couponRouter.post(
  "/",
  authorize("SELLER", "ADMIN"),
  validate(createCouponSchema),
  createCoupon,
);
couponRouter.patch(
  "/:id",
  authorize("SELLER", "ADMIN"),
  validate(updateCouponSchema),
  updateCoupon,
);
couponRouter.delete("/:id", authorize("SELLER", "ADMIN"), deleteCoupon);

export { couponRouter };
