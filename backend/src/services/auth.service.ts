import { userRepository } from "../repositories/user.repository.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";
import { AppError } from "../utils/app-error.js";
import { signAccessToken } from "../utils/jwt.js";
import { toUserDto } from "../utils/dto.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export const authService = {
  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(401, "Authentication is required.", "AUTH_REQUIRED");
    }

    return toUserDto(user);
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const token = signAccessToken({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    return {
      token,
      user: toUserDto(user),
    };
  },

  async register(input: RegisterInput) {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError(409, "Email is already registered.", "EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    const token = signAccessToken({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    return {
      token,
      user: toUserDto(user),
    };
  },
};
