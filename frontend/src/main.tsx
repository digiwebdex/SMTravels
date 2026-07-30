  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { API_BASE_URL } from "./app/lib/config";
  import { registerServiceWorker } from "./app/components/PwaInstallBanner";
  import "./app/i18n"; // initialise i18next (bn default) before first render
  import "./styles/index.css";

  // Expose the compiled-in API base URL (from VITE_API_URL) for debugging.
  (globalThis as Record<string, unknown>).__SMTRAVELS_API_BASE__ = API_BASE_URL;

  registerServiceWorker();

  createRoot(document.getElementById("root")!).render(<App />);
  