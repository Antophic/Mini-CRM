import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";

export const authRoutes = Router();

authRoutes.post("/register", validateRequest(registerSchema), authController.register);
authRoutes.post("/login", validateRequest(loginSchema), authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", requireAuth, authController.getMe);
