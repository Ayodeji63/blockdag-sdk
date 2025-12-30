import { useState } from "react";
import "./App.css";
import Auth from "./components/auth";
import { BlockDagIcon } from "./components/icons";
import { AuthModal } from "./components/auth-modal";

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <Auth />
//     </>
//   );
// }

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-950" : "bg-gray-50"} transition-colors`}
    >
      <div className="container mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1
            className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            BlockDag SDK Auth
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
                darkMode
                  ? "bg-gray-800 text-white hover:bg-gray-700"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Login / Sign Up
            </button>
          </div>
        </div>

        <div
          className={`rounded-xl ${darkMode ? "bg-gray-900" : "bg-white"} p-12 text-center shadow-xl`}
        >
          <BlockDagIcon className="mx-auto mb-6 h-24 w-24" />
          <h2
            className={`mb-4 text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Welcome to BlockDag SDK
          </h2>
          <p className={`mb-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Click the "Login / Sign Up" button to see the auth modal
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
