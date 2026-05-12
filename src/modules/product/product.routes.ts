import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
} from "./product.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadProduct } from "../../middlewares/upload.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "./product.validation";

const productRouter = Router();

// public
productRouter.get("/", validate(productQuerySchema), getProducts);
productRouter.get("/:slug", getProductBySlug);

// seller only
productRouter.post(
  "/",
  authenticate,
  authorize("SELLER"),
  uploadProduct.array("images", 10),
  validate(createProductSchema),
  createProduct,
);

productRouter.get(
  "/seller/my-products",
  authenticate,
  authorize("SELLER"),
  validate(productQuerySchema),
  getSellerProducts,
);

productRouter.patch(
  "/:id",
  authenticate,
  authorize("SELLER"),
  validate(updateProductSchema),
  updateProduct,
);

productRouter.delete("/:id", authenticate, authorize("SELLER"), deleteProduct);

productRouter.post(
  "/:id/images",
  authenticate,
  authorize("SELLER"),
  uploadProduct.array("images", 10),
  addProductImages,
);

productRouter.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("SELLER"),
  deleteProductImage,
);

export { productRouter };
