import type { AuthUser } from "../types";
import { apiRequest } from "./client";

export function getCurrentUser() {
  return apiRequest<{ user: AuthUser }>("/auth/me");
}

export function login(email: string, password: string) {
  return apiRequest<{ user: AuthUser }>("/auth/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });
}

export function logout() {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

export function register(input: { email: string; name?: string; password: string }) {
  return apiRequest<{ user: AuthUser }>("/auth/register", {
    body: JSON.stringify(input),
    method: "POST",
  });
}
