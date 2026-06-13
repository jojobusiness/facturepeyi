import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Suit les changements de route (SPA React Router) pour envoyer un PageView
// à chaque navigation. Le 1er PageView part déjà depuis index.html au chargement.
export default function PixelTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search]);
  return null;
}
