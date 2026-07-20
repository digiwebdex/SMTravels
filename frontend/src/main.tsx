
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { API_BASE_URL } from "./app/lib/config";
  import "./styles/index.css";

  // Expose the compiled-in API base URL (from VITE_API_URL) for debugging.
  // Entry-level side effect only — not wired into any component (app uses mock data).
  (globalThis as Record<string, unknown>).__SMTRAVELS_API_BASE__ = API_BASE_URL;

  createRoot(document.getElementById("root")!).render(<App />);
  