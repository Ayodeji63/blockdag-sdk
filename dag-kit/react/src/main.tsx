import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Providers } from "@/providers";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import VerifyEmailPage from "./pages/verify-emai.tsx";
import Dashboard from "./pages/dashboard.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route path="/*" element={<App />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Providers>
    </BrowserRouter>
  </StrictMode>
);
