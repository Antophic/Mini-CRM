import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/client";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../api/auth";
import type { AuthUser } from "../types";
import { getErrorMessage } from "../utils/errors";

export type AuthMode = "login" | "register";

export type AuthFormState = {
  email: string;
  name: string;
  password: string;
};

type ToastCallback = (message: string, tone: "success" | "error") => void;

const emptyAuthForm: AuthFormState = {
  email: "",
  name: "",
  password: "",
};

export function useAuth(showToast: ToastCallback) {
  const [authError, setAuthError] = useState("");
  const [authForm, setAuthForm] = useState<AuthFormState>(emptyAuthForm);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await getCurrentUser();

        if (active) {
          setUser(response.user);
        }
      } catch (error) {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          setAuthError("API server is not reachable. Start the backend and try again.");
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const updateAuthField = useCallback(
    (field: keyof AuthFormState, value: string) => {
      setAuthForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const switchAuthMode = useCallback(() => {
    setAuthError("");
    setAuthMode((current) => (current === "login" ? "register" : "login"));
  }, []);

  const handleAuthSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const email = authForm.email.trim();
      const password = authForm.password;

      if (!email || !password) {
        setAuthError("Enter your email and password.");
        return;
      }

      if (authMode === "register" && password.length < 8) {
        setAuthError("Password must contain at least 8 characters.");
        return;
      }

      setAuthSubmitting(true);
      setAuthError("");

      try {
        const response =
          authMode === "register"
            ? await register({
                email,
                name: authForm.name.trim() || undefined,
                password,
              })
            : await login(email, password);

        setUser(response.user);
        setAuthForm(emptyAuthForm);
        showToast(
          authMode === "register" ? "Account created successfully." : "Signed in successfully.",
          "success",
        );
      } catch (error) {
        setAuthError(getErrorMessage(error, "Unable to authenticate."));
      } finally {
        setAuthSubmitting(false);
      }
    },
    [authForm, authMode, showToast],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setUser(null);
    }
  }, []);

  return {
    authError,
    authForm,
    authLoading,
    authMode,
    authSubmitting,
    handleAuthSubmit,
    setAuthError,
    signOut,
    switchAuthMode,
    updateAuthField,
    user,
  };
}
