import { Button } from "@/components/ui/button";
import React from "react";
import { LogoutParams, useTurnkey } from "@turnkey/react-wallet-kit";
import { useAuth } from "@/providers/auth-provider";
function Dashboard() {
  const { handleLogout } = useAuth();

  return (
    <div>
      <Button onClick={() => handleLogout()}>Logout</Button>
    </div>
  );
}

export default Dashboard;
