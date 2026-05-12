import { Router } from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderItemStatus,
  cancelOrder,
} from "./order.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  placeOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from "./order.validation";

const orderRouter = Router();

orderRouter.use(authenticate);

// user routes
orderRouter.post(
  "/",
  authorize("USER"),
  validate(placeOrderSchema),
  placeOrder,
);
orderRouter.get("/my-orders", validate(orderQuerySchema), getMyOrders);
orderRouter.get("/my-orders/:id", getOrderById);
orderRouter.patch("/my-orders/:id/cancel", authorize("USER"), cancelOrder);

// seller routes
orderRouter.get(
  "/seller/orders",
  authorize("SELLER"),
  validate(orderQuerySchema),
  getSellerOrders,
);
orderRouter.patch(
  "/seller/items/:itemId/status",
  authorize("SELLER"),
  validate(updateOrderStatusSchema),
  updateOrderItemStatus,
);

export { orderRouter };
