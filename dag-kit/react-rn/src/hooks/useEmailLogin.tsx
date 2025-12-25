import { useState } from "react";
import { useDagKit } from "../context";
import { useAuthStore } from "../store";

export function useEmailLogin() {
  const { config } = useDagKit();
  const { setUser, setSession, setLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.turnkeyApiUrl}/auth/email/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const { user, session } = await response.json();

      setUser(user);
      setSession(session);

      return { user, session };
    } catch (error: any) {
      setError(error.message || "Email login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (
    email: string,
    password: string,
    name?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.turnkeyApiUrl}/auth/email/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        }
      );

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      const { user, session } = await response.json();

      setUser(user);
      setSession(session);

      return { user, session };
    } catch (error: any) {
      setError(error.message || "Email signup failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loginWithEmail,
    signupWithEmail,
    error,
  };
}
