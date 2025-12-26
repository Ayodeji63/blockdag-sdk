// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { DagKitProvider } from "@dag-kit/react-rn";
import { awakening } from "@dag-kit/kit";

const ORG_ID = import.meta.env.VITE_ORG_ID || undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DagKitProvider
      config={{
        turnkeyOrganizationId: ORG_ID!,
        turnkeyApiUrl: "http://localhost:3000",
        chain: awakening.chain_config,
        rpcUrl: "https://sepolia.rpc.thirdweb.com",
        enabledProviders: ["google", "apple", "discord", "email"],
        appearance: {
          mode: "light",
          logo: "/logo.png",
          brandColor: "#6366f1",
        },
      }}
    >
      <App />
    </DagKitProvider>
  </StrictMode>
);
