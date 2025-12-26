import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { DagKitConfig } from "../types";
import { useAuthStore } from "../store";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { DagKitContextValue, DagKitContext } from "./DagKitProvider";
import { LoginModal } from "../components/LoginModal";

export function DagKitProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: DagKitConfig;
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { setTurnkeyClient, refreshSession, session } = useAuthStore();

  useEffect(() => {
    const initTurnkey = async () => {
      try {
        const stamper = new WebauthnStamper({
          rpId: window.location.hostname,
        });

        const client = new TurnkeyClient(
          {
            baseUrl: config.turnkeyApiUrl!,
          },
          stamper
        );

        setTurnkeyClient(client);
      } catch (error) {
        console.error("Failed to initialize Turnkey:", error);
      }
    };

    initTurnkey();
  }, [config.turnkeyApiUrl, setTurnkeyClient]);

  useEffect(() => {
    if (!session || !session.isActive) return;

    const checkSession = setInterval(() => {
      const now = Date.now();
      const expiresIn = session.expiresAt - now;

      if (expiresIn < 5 * 60 * 1000 && expiresIn > 0) {
        refreshSession();
      }
    }, 60000);

    return () => clearInterval(checkSession);
  }, [session, refreshSession]);

  const value: DagKitContextValue = {
    config,
    openLoginModal: () => setShowLoginModal(true),
    closeLoginModal: () => setShowLoginModal(false),
  };

  return (
    <DagKitContext.Provider value={value}>
      {children}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </DagKitContext.Provider>
  );
}

export function useDagKit() {
  const context = useContext(DagKitContext);
  if (!context) {
    throw new Error("UseDagKit must be used within DagKitProvider");
  }
  return context;
}
