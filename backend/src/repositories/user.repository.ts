import type { Prisma, User } from "@prisma/client";
import { prisma } from "../config/prisma.js";

function safeUserSelect() {
  return {
    createdAt: true,
    email: true,
    id: true,
    name: true,
    role: true,
  } satisfies Prisma.UserSelect;
}

export const userRepository = {
  create(data: Pick<User, "email" | "passwordHash"> & Partial<Pick<User, "name">>) {
    return prisma.user.create({
      data,
      select: safeUserSelect(),
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      select: safeUserSelect(),
      where: { id },
    });
  },
};
