import { LoginButton } from "./components/LoginButton";
import { Dashboard } from "./pages/dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OAuthCallbackPage } from "@dag-kit/react-rn";

export function App() {
  function Home() {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">BlockDAG</div>
          <div className="nav-menu">{/* <LoginButton /> */}</div>
        </nav>

        <main className="main-content">
          <Dashboard />
        </main>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}
