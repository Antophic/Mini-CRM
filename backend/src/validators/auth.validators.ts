import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(255)
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(128, "Password must not exceed 128 characters.");

export const registerSchema = {
  body: z.object({
    email: emailSchema,
    name: z.string().trim().max(120).optional(),
    password: passwordSchema,
  }),
};

export const loginSchema = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required."),
  }),
};

export type LoginInput = z.infer<typeof loginSchema.body>;
export type RegisterInput = z.infer<typeof registerSchema.body>;
