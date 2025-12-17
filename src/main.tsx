import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/analytics";

// Initialize PostHog analytics
initPostHog();

createRoot(document.getElementById("root")!).render(<App />);
