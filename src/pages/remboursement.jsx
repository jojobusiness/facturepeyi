export default function Remboursement() {
  return (
    <main className="p-6 max-w-4xl mx-auto text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Politique de remboursement</h1>
      <p className="mb-6 text-sm text-gray-500">Dernière mise à jour : 24 mai 2026</p>

      <p className="mb-6">
        La présente politique précise les conditions dans lesquelles un remboursement peut être accordé sur un abonnement souscrit à Factur'Peyi. Elle fait partie intégrante des <a href="/cgv" className="text-emerald-700 underline">Conditions Générales de Vente</a>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Période d'essai</h2>
      <p>
        Tout nouveau compte bénéficie d'une <strong>période d'essai gratuite de 30 jours</strong> sur les fonctionnalités payantes, sans engagement et sans saisie de moyen de paiement. À l'issue de la période, le compte bascule automatiquement sur le plan gratuit Découverte, sauf souscription explicite à un plan payant.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. Abonnements mensuels</h2>
      <p>
        Toute mensualité réglée est <strong>ferme et définitive</strong>. Aucun remboursement n'est accordé sur une mensualité déjà débitée, sauf en cas de dysfonctionnement majeur avéré du Service rendant celui-ci inutilisable pendant une partie significative du mois concerné.
      </p>
      <p className="mt-2">
        Le Client peut résilier à tout moment depuis son espace <a href="/dashboard/mon-abonnement" className="text-emerald-700 underline">Mon Abonnement</a> ; la résiliation prend effet à l'issue de la période en cours déjà payée, sans nouveau prélèvement.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Abonnements annuels</h2>
      <p>
        Les abonnements annuels peuvent faire l'objet d'un <strong>remboursement partiel dans les 14 jours suivant la souscription</strong>, sur demande motivée, à condition que le Service n'ait pas été utilisé de manière substantielle (limite indicative : moins de 10 factures émises et aucun export comptable réalisé).
      </p>
      <p className="mt-2">
        Au-delà de 14 jours, aucun remboursement n'est accordé sur la période restante, mais le renouvellement annuel automatique peut être désactivé depuis l'espace Mon Abonnement.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Cas de dysfonctionnement avéré</h2>
      <p>
        En cas d'indisponibilité prolongée du Service imputable à l'Éditeur (interruption supérieure à 48 heures consécutives hors maintenance planifiée), un avoir prorata temporis pourra être accordé sur la prochaine période de facturation, sur demande écrite du Client.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Cas exclus du remboursement</h2>
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li>Demande formulée après la fin de la période de facturation en cours ;</li>
        <li>Utilisation abusive ou frauduleuse du Service ;</li>
        <li>Erreur de configuration imputable au Client (territoire, régime fiscal, etc.) ;</li>
        <li>Indisponibilité d'un sous-traitant tiers (Stripe, Vercel, Firebase) constituant un cas de force majeure ;</li>
        <li>Frais bancaires éventuels liés au remboursement (à la charge du Client).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Procédure de demande</h2>
      <p>
        Toute demande de remboursement doit être adressée par email à <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a> en précisant&nbsp;:
      </p>
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li>Le nom, prénom et email associés au compte ;</li>
        <li>La référence de la facture concernée ;</li>
        <li>Le motif détaillé de la demande.</li>
      </ul>
      <p className="mt-2">
        Une réponse est apportée sous <strong>10 jours ouvrés</strong>. En cas d'accord, le remboursement est effectué sur le moyen de paiement initial via Stripe, sous un délai de 5 à 10 jours bancaires.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Contact</h2>
      <p>
        Pour toute question relative à la présente politique : <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a>
      </p>
    </main>
  );
}
