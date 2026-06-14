import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { loadPixel } from "../lib/pixel";

// Charge le pixel au démarrage (1er run → loadPixel envoie le 1er PageView),
// puis envoie un PageView à chaque changement de route (SPA).
export default function PixelTracker() {
  const location = useLocation();
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      loadPixel(); // envoie le PageView initial
      return;
    }
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search]);
  return null;
}
