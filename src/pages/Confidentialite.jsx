export default function Confidentialite() {
  return (
    <main className="p-6 max-w-4xl mx-auto text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Politique de Confidentialité</h1>
      <p className="mb-6 text-sm text-gray-500">Dernière mise à jour : 24 mai 2026</p>

      <p className="mb-6">
        La présente politique décrit la manière dont Factur'Peyi collecte, utilise et protège les données personnelles de ses utilisateurs, conformément au Règlement (UE) 2016/679 (« <strong>RGPD</strong> ») et à la loi Informatique et Libertés modifiée.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Responsable de traitement</h2>
      <ul className="list-disc ml-6 space-y-1 text-sm">
        <li><strong>Joseph TWIZEYIMANA</strong>, entrepreneur individuel — nom commercial <em>Jojo Empire</em></li>
        <li>29 Rue Daviel, 75013 Paris, France</li>
        <li>SIREN : 105 341 036 — SIRET : 10534103600017</li>
        <li>Contact : <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a></li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. Données collectées</h2>
      <p>Les catégories de données traitées sont les suivantes&nbsp;:</p>
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li><strong>Données d'identification du compte</strong> : nom, prénom, email, mot de passe (haché), rôle dans l'entreprise.</li>
        <li><strong>Données professionnelles</strong> : nom de l'entreprise, SIRET, territoire, régime fiscal, adresse.</li>
        <li><strong>Données métier</strong> : factures, devis, clients, dépenses, paiements (saisis par l'utilisateur).</li>
        <li><strong>Données de paiement</strong> : aucune donnée bancaire complète n'est stockée par Factur'Peyi. Elles sont traitées exclusivement par Stripe (PCI-DSS niveau 1).</li>
        <li><strong>Données techniques</strong> : adresse IP, journaux d'accès, type de navigateur, identifiants techniques, cookies.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Finalités et bases légales</h2>
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li><strong>Exécution du contrat</strong> (art. 6.1.b RGPD) : fourniture du Service, gestion du compte, facturation.</li>
        <li><strong>Obligations légales</strong> (art. 6.1.c RGPD) : conservation comptable, lutte anti-fraude, réponse aux réquisitions.</li>
        <li><strong>Intérêt légitime</strong> (art. 6.1.f RGPD) : sécurité du Service, prévention de la fraude, amélioration du produit, communication transactionnelle.</li>
        <li><strong>Consentement</strong> (art. 6.1.a RGPD) : envoi de newsletters, cookies non essentiels.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Destinataires et sous-traitants</h2>
      <p>Les données peuvent être traitées par les sous-traitants suivants, contractuellement engagés à respecter le RGPD&nbsp;:</p>
      <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
        <li><strong>Vercel Inc.</strong> (USA) — hébergement applicatif. Certifié SOC 2.</li>
        <li><strong>Google LLC / Firebase</strong> (USA / UE) — base de données et stockage. Données stockées en région européenne lorsque la configuration le permet.</li>
        <li><strong>Stripe Payments Europe, Ltd</strong> (Irlande) — traitement des paiements. Certifié PCI-DSS niveau 1.</li>
        <li><strong>Resend Inc.</strong> (USA) — envoi d'emails transactionnels.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Transferts hors Union européenne</h2>
      <p>
        Certains sous-traitants étant établis aux États-Unis, des transferts de données peuvent intervenir hors de l'UE. Ces transferts sont encadrés par les <strong>Clauses Contractuelles Types</strong> de la Commission européenne et, pour Vercel et Google, par leur adhésion au <em>EU-U.S. Data Privacy Framework</em>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Durée de conservation</h2>
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li><strong>Données du compte</strong> : pendant toute la durée de la relation contractuelle, puis 3 ans après la dernière activité à des fins de prospection.</li>
        <li><strong>Données comptables et factures</strong> : 10 ans à compter de l'exercice concerné, conformément aux obligations légales (art. L.123-22 du Code de commerce).</li>
        <li><strong>Journaux techniques</strong> : 12 mois maximum.</li>
        <li><strong>Cookies</strong> : durée maximale de 13 mois.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Sécurité</h2>
      <p>
        Factur'Peyi met en œuvre des mesures techniques et organisationnelles adaptées pour protéger les données : chiffrement TLS des communications, chiffrement au repos chez Firebase, hachage des mots de passe (Firebase Auth), règles d'accès Firestore restrictives par rôle, journalisation des accès administratifs, sauvegardes automatiques.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">8. Vos droits</h2>
      <p>Conformément au RGPD, l'utilisateur dispose des droits suivants&nbsp;:</p>
      <ul className="list-disc ml-6 mt-2 space-y-1">
        <li>Droit d'accès et de copie de ses données ;</li>
        <li>Droit de rectification ;</li>
        <li>Droit à l'effacement (« droit à l'oubli ») ;</li>
        <li>Droit à la limitation du traitement ;</li>
        <li>Droit à la portabilité ;</li>
        <li>Droit d'opposition au traitement fondé sur l'intérêt légitime ;</li>
        <li>Droit de retirer son consentement à tout moment ;</li>
        <li>Droit de définir des directives <em>post mortem</em>.</li>
      </ul>
      <p className="mt-2">
        Ces droits peuvent être exercés par email à <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a>, accompagnés d'un justificatif d'identité si nécessaire. Une réponse est apportée dans un délai maximal d'un (1) mois.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">9. Cookies</h2>
      <p>
        Le Service utilise des cookies pour assurer son bon fonctionnement, mesurer l'audience et améliorer l'expérience. Le détail figure dans la <a href="/cookies" className="text-emerald-700 underline">Politique de Cookies</a>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">10. Réclamation</h2>
      <p>
        L'utilisateur dispose du droit d'introduire une réclamation auprès de la <strong>CNIL</strong> (3 Place de Fontenoy — TSA 80715 — 75334 Paris Cedex 07, <a href="https://www.cnil.fr" className="text-emerald-700 underline">www.cnil.fr</a>) s'il estime que le traitement de ses données n'est pas conforme à la réglementation applicable.
      </p>

      <p className="mt-10 text-sm text-gray-500">
        Pour toute demande relative à la présente politique : <a href="mailto:contact@facturepeyi.com" className="text-emerald-700 underline">contact@facturepeyi.com</a>
      </p>
    </main>
  );
}
