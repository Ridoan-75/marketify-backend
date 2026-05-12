import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadAvatar as uploadAvatarMiddleware } from "../../middlewares/upload.middleware";
import {
  updateProfileSchema,
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./user.validation";

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me", getProfile);
userRouter.patch("/me", validate(updateProfileSchema), updateProfile);
userRouter.patch(
  "/me/avatar",
  uploadAvatarMiddleware.single("avatar"),
  uploadAvatar,
);
userRouter.patch(
  "/me/change-password",
  validate(changePasswordSchema),
  changePassword,
);

userRouter.get("/me/addresses", getAddresses);
userRouter.post("/me/addresses", validate(createAddressSchema), createAddress);
userRouter.patch(
  "/me/addresses/:id",
  validate(updateAddressSchema),
  updateAddress,
);
userRouter.delete("/me/addresses/:id", deleteAddress);
userRouter.patch("/me/addresses/:id/default", setDefaultAddress);

export { userRouter };
