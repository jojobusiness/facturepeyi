import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, grantConsent, denyConsent, initConsent } from "../lib/pixel";

// Bandeau de consentement CNIL. Le pixel Meta n'est chargé qu'après "Tout accepter".
// "Refuser" est aussi simple et visible que "Accepter" (exigence CNIL).
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    initConsent(); // recharge le pixel si l'utilisateur avait déjà accepté
    if (!getConsent()) setVisible(true); // pas encore de choix → afficher
  }, []);

  if (!visible) return null;

  const accept = () => {
    grantConsent();
    setVisible(false);
  };
  const refuse = () => {
    denyConsent();
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-2xl rounded-2xl p-5 sm:p-6">
        <h2 className="font-bold text-[#0d1b3e] text-sm sm:text-base">🍪 Tu gardes le contrôle</h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
          On utilise un cookie de mesure publicitaire (pixel Meta) pour comprendre d'où
          viennent nos visiteurs et améliorer le service. Il n'est déposé qu'avec ton accord.
          Les cookies nécessaires au fonctionnement du site restent actifs.{" "}
          <Link to="/cookies" className="text-emerald-700 underline">En savoir plus</Link>.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={refuse}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-sm transition"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
