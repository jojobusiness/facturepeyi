import { useState } from "react";
import { getConsent, grantConsent, denyConsent } from "../lib/pixel";

function GestionConsentement() {
  const [choix, setChoix] = useState(getConsent()); // "granted" | "denied" | null

  const accepter = () => {
    grantConsent();
    setChoix("granted");
  };
  const refuser = () => {
    const avait = getConsent() === "granted";
    denyConsent();
    setChoix("denied");
    // Si le pixel avait déjà été chargé dans la session, on recharge pour le stopper.
    if (avait) window.location.reload();
  };

  return (
    <div className="mt-3 border border-gray-200 rounded-xl p-5 bg-gray-50">
      <p className="text-sm mb-3">
        État actuel :{" "}
        <strong>
          {choix === "granted"
            ? "Cookies de mesure publicitaire acceptés"
            : choix === "denied"
            ? "Cookies de mesure publicitaire refusés"
            : "Aucun choix enregistré"}
        </strong>
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={refuser}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2.5 rounded-lg text-sm transition"
        >
          Refuser
        </button>
        <button
          onClick={accepter}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}

export default function Cookies() {
  return (
    <main className="p-6 max-w-4xl mx-auto text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Politique de Cookies</h1>
      <p className="mb-6 text-sm text-gray-500">Dernière mise à jour : 14 juin 2026</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Qu'est-ce qu'un cookie&nbsp;?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur le terminal de l'utilisateur (ordinateur, tablette, smartphone) lors de sa visite sur un site web. Il permet au site de reconnaître l'utilisateur, de mémoriser ses préférences ou de mesurer son audience.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. Cookies utilisés par Factur'Peyi</h2>
      <ul className="list-disc ml-6 mt-2 space-y-2">
        <li>
          <strong>Cookies strictement nécessaires</strong> — indispensables au fonctionnement du Service (authentification Firebase, session, sécurité CSRF). Ces cookies ne nécessitent pas de consentement (article 82 de la loi Informatique et Libertés).
        </li>
        <li>
          <strong>Cookies de mesure d'audience</strong> — Vercel Analytics et Speed Insights, configurés pour ne pas collecter de données personnelles et ne pas nécessiter de consentement explicite (mode <em>privacy-friendly</em>).
        </li>
        <li>
          <strong>Cookies tiers — Stripe</strong> — déposés uniquement sur la page de paiement par Stripe pour des raisons de sécurité anti-fraude. Voir la <a href="https://stripe.com/cookies-policy" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">politique cookies de Stripe</a>.
        </li>
        <li>
          <strong>Cookies de mesure publicitaire — Pixel Meta (Facebook/Instagram)</strong> — utilisés pour mesurer l'efficacité de nos campagnes publicitaires et comprendre la provenance de nos visiteurs. <strong>Ces cookies ne sont déposés qu'avec votre consentement préalable</strong> et ne sont jamais chargés tant que vous n'avez pas cliqué sur « Tout accepter ». Vous pouvez accepter, refuser ou modifier votre choix à tout moment ci-dessous (section 4). Voir la <a href="https://www.facebook.com/privacy/policy/" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">politique de confidentialité de Meta</a>.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Durée de conservation</h2>
      <p>
        Conformément aux recommandations de la CNIL, la durée de conservation des cookies n'excède pas <strong>13 mois</strong>. Au-delà, le consentement (le cas échéant) est sollicité à nouveau.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Gérer mon consentement</h2>
      <p>
        Vous pouvez à tout moment accepter ou retirer votre consentement aux cookies de mesure publicitaire (pixel Meta). Le retrait est aussi simple que l'acceptation et prend effet immédiatement.
      </p>
      <GestionConsentement />

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Gestion via votre navigateur</h2>
      <p>
        L'utilisateur peut à tout moment configurer son navigateur pour bloquer ou supprimer les cookies déjà déposés. La désactivation des cookies strictement nécessaires peut entraîner l'impossibilité d'accéder à certaines fonctionnalités du Service (notamment l'authentification).
      </p>
      <p className="mt-2">Liens utiles selon le navigateur&nbsp;:</p>
      <ul className="list-disc ml-6 mt-1 space-y-1 text-sm">
        <li><a href="https://support.google.com/chrome/answer/95647" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/effacer-cookies-donnees-site-firefox" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Contact</h2>
      <p>
        Pour toute question relative à la présente politique : <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a>
      </p>
    </main>
  );
}
