import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In production the Express server is on a different host from the static frontend.
// VITE_API_BASE_URL is injected at build time (e.g. https://aniexplore-api.onrender.com).
// In dev, Vite proxies /api → localhost:5001, so no base URL is needed.
setBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");

createRoot(document.getElementById("root")!).render(<App />);
