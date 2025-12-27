import { useAuthStore } from "../store";

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, session } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    session,
  };
}
