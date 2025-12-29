import { useState } from "react";
import "./App.css";
import Auth from "./components/auth";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Auth />
    </>
  );
}

export default App;
