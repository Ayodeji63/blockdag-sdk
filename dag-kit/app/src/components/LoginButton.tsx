import React from "react";
import { useDagKit, useAuth } from "@dag-kit/react-rn";

export function LoginButton() {
  const { openLoginModal } = useDagKit();
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return (
      <div className="user-profile">
        <img src={user.picture} alt={user.name} />
        <span>{user.name}</span>
      </div>
    );
  }

  return (
    <button onClick={openLoginModal} className="login-btn">
      Sign In
    </button>
  );
}
