import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Suit les changements de route (SPA) pour envoyer un PageView à chaque navigation.
// Le tout 1er PageView est déjà envoyé par loadPixel() au moment du consentement,
// donc on saute le premier passage pour ne pas le compter deux fois.
// Si l'utilisateur n'a pas consenti, window.fbq n'existe pas → aucun event (no-op).
export default function PixelTracker() {
  const location = useLocation();
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search]);
  return null;
}
