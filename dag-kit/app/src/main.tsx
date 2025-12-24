// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { DagAAProvider } from "@dag-kit/react";
import { awakening } from "@dag-kit/kit";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DagAAProvider
      privyAppId={import.meta.env.VITE_PRIVY_APP_ID || ""}
      config={{
        chain: awakening.chain_config,
        rpcUrl: import.meta.env.VITE_RPC_URL,
        bundlerUrl: awakening.bundler_rpc,
        factoryAddress: import.meta.env.VITE_FACTORY_ADDRESS,
        paymasterUrl: import.meta.env.VITE_PAYMASTER_URL,
      }}
      privyConfig={{
        // Optional: Customize Privy
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
        },
        loginMethods: ["email", "google", "wallet"],
      }}
    >
      <App />
    </DagAAProvider>
  </StrictMode>
);
