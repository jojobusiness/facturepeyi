export default function CGV() {
  return (
    <main className="p-6 max-w-4xl mx-auto text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Conditions Générales de Vente</h1>
      <p className="mb-6 text-sm text-gray-500">Dernière mise à jour : 24 mai 2026</p>

      <p className="mb-6">
        Les présentes Conditions Générales de Vente (« <strong>CGV</strong> ») régissent les relations contractuelles entre l'Éditeur de Factur'Peyi et tout client souscrivant à un abonnement payant au Service. Elles s'appliquent à l'exclusion de toutes autres conditions, notamment celles du Client.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Éditeur (Vendeur)</h2>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li><strong>Joseph TWIZEYIMANA</strong>, entrepreneur individuel — nom commercial <em>Jojo Empire</em></li>
        <li>Siège social : 29 Rue Daviel, 75013 Paris, France</li>
        <li>SIREN : 105 341 036 — SIRET : 10534103600017</li>
        <li>Code APE/NAF : 6202A</li>
        <li>Régime fiscal : Micro-entreprise (BNC), franchise en base de TVA</li>
        <li>TVA non applicable, art. 293 B du CGI</li>
        <li>Contact : <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a></li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. Objet</h2>
      <p>
        Les présentes CGV ont pour objet de définir les conditions dans lesquelles l'Éditeur propose au Client un accès payant au Service Factur'Peyi sous forme d'abonnement mensuel ou annuel, dans le cadre d'une relation strictement professionnelle (B2B).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Offres et prix</h2>
      <p>
        Les offres d'abonnement disponibles, leurs fonctionnalités et leurs prix sont décrits sur la page <a href="/Forfaits" className="text-emerald-700 underline">Forfaits</a>. Tous les prix sont indiqués en euros (€), nets de TVA (franchise en base — art. 293 B du CGI). Les prix peuvent être modifiés à tout moment, étant entendu que toute modification ne s'appliquera qu'aux nouvelles souscriptions ou au prochain renouvellement pour les abonnements en cours.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Souscription</h2>
      <p>
        La souscription s'effectue en ligne depuis la page Forfaits ou depuis l'espace « Mon Abonnement ». Le contrat est formé dès validation du paiement par Stripe. Une confirmation est envoyée par email à l'adresse renseignée par le Client.
      </p>
      <p className="mt-2">
        Le Client garantit avoir la capacité juridique de conclure le présent contrat et agir dans le cadre de son activité professionnelle. En cas de souscription pour le compte d'une personne morale, le signataire garantit disposer du pouvoir d'engager celle-ci.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Période d'essai</h2>
      <p>
        Le Service propose une période d'essai gratuite de trente (30) jours sur les fonctionnalités payantes. Aucun moyen de paiement n'est requis pendant la période d'essai. À l'expiration, le compte bascule automatiquement sur le plan gratuit Découverte sauf souscription explicite à un plan payant.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Paiement</h2>
      <p>
        Les paiements sont traités par <strong>Stripe Payments Europe, Ltd</strong>, prestataire de services de paiement agréé. L'Éditeur n'a jamais connaissance des données bancaires complètes du Client (numéro de carte, CVV). Le prélèvement est automatique à la date anniversaire de la souscription.
      </p>
      <p className="mt-2">
        En cas d'échec de paiement, l'Éditeur en informe le Client par email. Plusieurs tentatives sont effectuées par Stripe. À défaut de régularisation dans un délai de quinze (15) jours, l'accès au Service peut être suspendu sans préavis supplémentaire.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Durée et renouvellement</h2>
      <p>
        Les abonnements sont conclus pour une durée déterminée (mensuelle ou annuelle) avec <strong>tacite reconduction</strong> par période identique. Le Client peut résilier à tout moment depuis son espace « Mon Abonnement » ; la résiliation prend effet à l'issue de la période en cours déjà payée.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">8. Droit de rétractation</h2>
      <p>
        Le Service étant exclusivement destiné aux professionnels agissant dans le cadre de leur activité (B2B), <strong>le droit de rétractation de 14 jours prévu par les articles L.221-18 et suivants du Code de la consommation ne s'applique pas</strong>. Le Client est néanmoins protégé par la politique de remboursement décrite ci-après.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">9. Remboursement</h2>
      <p>
        Les modalités détaillées de remboursement (abonnements mensuels, annuels, période d'essai, exceptions) sont décrites dans la <a href="/remboursement" className="text-emerald-700 underline">Politique de remboursement</a>, qui fait partie intégrante des présentes CGV.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">10. Obligations de l'Éditeur</h2>
      <p>
        L'Éditeur s'engage à fournir le Service avec diligence et selon les règles de l'art, à mettre en œuvre des mesures de sécurité raisonnables pour protéger les données du Client, et à corriger dans des délais raisonnables tout dysfonctionnement avéré signalé par écrit. L'Éditeur s'oblige à une obligation de moyens, et non de résultat.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">11. Obligations du Client</h2>
      <p>
        Le Client s'engage à utiliser le Service conformément aux <a href="/conditions" className="text-emerald-700 underline">CGU</a>, à régler ponctuellement les sommes dues, à maintenir à jour ses informations de facturation, et à respecter ses propres obligations fiscales, comptables et sociales. Les contenus saisis (factures, données clients, dépenses) sont sous la seule responsabilité du Client.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">12. Suspension et résiliation pour faute</h2>
      <p>
        En cas de manquement grave du Client à ses obligations (défaut de paiement, utilisation frauduleuse, atteinte à la sécurité du Service, contenu illicite), l'Éditeur pourra suspendre ou résilier l'abonnement de plein droit, sans préavis ni remboursement, après notification par email restée sans effet pendant huit (8) jours.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">13. Limitation de responsabilité</h2>
      <p>
        La responsabilité de l'Éditeur ne saurait être engagée pour les dommages indirects, perte de chiffre d'affaires, perte de clientèle, atteinte à l'image ou perte de données imputable à une cause externe au Service. En tout état de cause, le montant total des indemnités dues par l'Éditeur ne pourra excéder le montant effectivement réglé par le Client au titre des douze (12) derniers mois précédant le fait générateur du litige.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">14. Force majeure</h2>
      <p>
        Aucune des parties ne pourra être tenue responsable d'un manquement résultant d'un cas de force majeure au sens de l'article 1218 du Code civil et de la jurisprudence française, en ce compris notamment : panne généralisée d'Internet, attaque informatique d'ampleur, défaillance d'un sous-traitant majeur (Vercel, Firebase, Stripe), décision administrative.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">15. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est régi par la <a href="/confidentialite" className="text-emerald-700 underline">Politique de Confidentialité</a>, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés modifiée.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">16. Sous-traitance et cession</h2>
      <p>
        L'Éditeur se réserve le droit de céder le présent contrat à tout tiers dans le cadre d'une réorganisation, fusion, cession partielle ou totale d'activité, le Client en étant informé par email. Le Client ne peut céder ses droits sans accord écrit préalable de l'Éditeur.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">17. Médiation et juridiction</h2>
      <p>
        En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action contentieuse. À défaut d'accord dans un délai de trente (30) jours suivant la première notification écrite, le litige sera porté devant les tribunaux compétents du ressort de Paris, le droit français étant seul applicable.
      </p>

      <p className="mt-10 text-sm text-gray-500">
        Pour toute question relative aux présentes CGV : <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a>
      </p>
    </main>
  );
}
