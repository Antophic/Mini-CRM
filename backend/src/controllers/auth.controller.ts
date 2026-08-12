import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { clearAuthCookie, setAuthCookie } from "../utils/auth-cookie.js";
import { sendSuccess } from "../utils/response.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";

export const authController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.id);
    sendSuccess(res, { user });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput);
    setAuthCookie(res, result.token);
    sendSuccess(res, { user: result.user });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    clearAuthCookie(res);
    sendSuccess(res, { message: "Signed out successfully." });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput);
    setAuthCookie(res, result.token);
    sendSuccess(res, { user: result.user }, 201);
  }),
};
