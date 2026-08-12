import type { Response } from "express";
import { env, isProduction } from "../config/env.js";

function cookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE || isProduction,
  } as const;
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(env.COOKIE_NAME, cookieOptions());
}
