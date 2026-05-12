import { Router } from "express";
import {
  getAdminDashboard,
  getAllUsers,
  banUser,
  unbanUser,
  getPendingSellers,
  getAllSellers,
  approveSeller,
  rejectSeller,
  suspendSeller,
  getAllOrders,
  getAllProductsAdmin,
  updateProductStatusAdmin,
  getPendingWithdrawals,
  processWithdrawal,
} from "./admin.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const adminRouter = Router();

adminRouter.use(authenticate, authorize("ADMIN"));

adminRouter.get("/dashboard", getAdminDashboard);

adminRouter.get("/users", getAllUsers);
adminRouter.patch("/users/:userId/ban", banUser);
adminRouter.patch("/users/:userId/unban", unbanUser);

adminRouter.get("/sellers", getAllSellers);
adminRouter.get("/sellers/pending", getPendingSellers);
adminRouter.patch("/sellers/:sellerId/approve", approveSeller);
adminRouter.patch("/sellers/:sellerId/reject", rejectSeller);
adminRouter.patch("/sellers/:sellerId/suspend", suspendSeller);

adminRouter.get("/orders", getAllOrders);

adminRouter.get("/products", getAllProductsAdmin);
adminRouter.patch("/products/:productId/status", updateProductStatusAdmin);

adminRouter.get("/withdrawals/pending", getPendingWithdrawals);
adminRouter.patch("/withdrawals/:withdrawalId/process", processWithdrawal);

export { adminRouter };
