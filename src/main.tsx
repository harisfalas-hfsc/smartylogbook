import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";
import { initConnectivity } from "./lib/offline/connectivity";

initTheme();

// Connectivity must be known before the first render so an offline start
// (airplane mode, native app cold start) never flashes the online path.
void initConnectivity();

createRoot(document.getElementById("root")!).render(<App />);
