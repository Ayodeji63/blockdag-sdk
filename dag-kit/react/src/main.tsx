import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { Providers } from "@/providers";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import VerifyEmailPage from "./pages/verify-email.tsx";
import Dashboard from "./pages/dashboard.tsx";
import { DagClientProvider } from "./providers/dag-provider.tsx";
import Index from "./pages/Index.tsx";
import Profile from "./pages/Profile.tsx";
import { Toaster } from "sonner";

// import "@turnkey/react-wallet-kit/styles.css";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <BrowserRouter>
    <Providers>
      <Routes>
        <Route path="/*" element={<Index />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/dashboard"
          element={
            <>
              {/* <DagClientProvider> */}
              <Dashboard />
              {/* </DagClientProvider> */}
            </>
          }
        />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Providers>
    <Toaster />
  </BrowserRouter>
  // </StrictMode>
);
