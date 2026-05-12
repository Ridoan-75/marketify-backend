import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "marketify/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  } as object,
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "marketify/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
  } as object,
});

const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "marketify/banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1920, height: 600, crop: "fill" }],
  } as object,
});

export const uploadAvatar = multer({ storage: avatarStorage });
export const uploadProduct = multer({ storage: productStorage });
export const uploadBanner = multer({ storage: bannerStorage });
