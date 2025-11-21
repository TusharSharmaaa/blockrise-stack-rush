import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./components/ThemeProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import { HapticsProvider } from "./hooks/useHaptics";

// Fix for dynamic viewport height on mobile devices
const setVH = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Set on load
setVH();

// Update on resize and orientation change
// Note: These listeners are intentionally not removed as they need to persist for the app lifetime
// They are lightweight and necessary for proper mobile viewport handling
window.addEventListener('resize', setVH, { passive: true });
window.addEventListener('orientationchange', setVH, { passive: true });

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="theme-preference">
      <HapticsProvider>
        <App />
      </HapticsProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
