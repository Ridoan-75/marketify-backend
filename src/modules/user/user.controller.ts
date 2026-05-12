import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getProfileService,
  updateProfileService,
  updateAvatarService,
  changePasswordService,
  getAddressesService,
  createAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
} from "./user.service";

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await getProfileService(req.user!.id);
    sendResponse({ res, message: "Profile fetched successfully.", data: user });
  },
);

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await updateProfileService(req.user!.id, req.body);
    sendResponse({ res, message: "Profile updated successfully.", data: user });
  },
);

export const uploadAvatar = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "No file uploaded.",
      });
    }
    const avatarUrl = (req.file as Express.Multer.File & { path: string }).path;
    const user = await updateAvatarService(req.user!.id, avatarUrl);
    sendResponse({ res, message: "Avatar updated successfully.", data: user });
  },
);

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await changePasswordService(req.user!.id, req.body);
    sendResponse({ res, message: "Password changed successfully." });
  },
);

export const getAddresses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const addresses = await getAddressesService(req.user!.id);
    sendResponse({
      res,
      message: "Addresses fetched successfully.",
      data: addresses,
    });
  },
);

export const createAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const address = await createAddressService(req.user!.id, req.body);
    sendResponse({
      res,
      statusCode: 201,
      message: "Address created successfully.",
      data: address,
    });
  },
);

export const updateAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const address = await updateAddressService(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendResponse({
      res,
      message: "Address updated successfully.",
      data: address,
    });
  },
);

export const deleteAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await deleteAddressService(req.user!.id, req.params.id as string);
    sendResponse({ res, message: "Address deleted successfully." });
  },
);

export const setDefaultAddress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const address = await setDefaultAddressService(req.user!.id, req.params.id as string);
    sendResponse({ res, message: "Default address updated.", data: address });
  },
);
