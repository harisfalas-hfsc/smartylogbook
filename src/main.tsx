import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";
import { initConnectivity } from "./lib/offline/connectivity";

initTheme();

// Connectivity must be known before the first render so an offline start
// (airplane mode, native app cold start) never flashes the online path.
const root = document.getElementById("root");

const start = async () => {
  await initConnectivity();
  if (!root) throw new Error("App root was not found");
  createRoot(root).render(<App />);
};

void start();
