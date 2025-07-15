export default function Confidentialite() {
  return (
    <main className="p-6 max-w-4xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Politique de Confidentialité</h1>
      <p className="mb-2">Dernière mise à jour : 15 juillet 2025</p>

      <h2 className="text-xl mt-6 font-semibold">1. Données collectées</h2>
      <p>Nous collectons uniquement les données nécessaires à l’usage du service (nom, email, entreprise, etc.).</p>

      <h2 className="text-xl mt-6 font-semibold">2. Utilisation</h2>
      <p>Les données sont utilisées pour gérer vos factures, dépenses, et autres fonctionnalités comptables.</p>

      <h2 className="text-xl mt-6 font-semibold">3. Conservation</h2>
      <p>Les données sont conservées tant que le compte est actif. Vous pouvez demander leur suppression à tout moment.</p>

      <h2 className="text-xl mt-6 font-semibold">4. Sécurité</h2>
      <p>Les données sont stockées sur des serveurs sécurisés (Firebase). Nous appliquons des protocoles de sécurité stricts.</p>

      <h2 className="text-xl mt-6 font-semibold">5. Vos droits</h2>
      <p>Vous pouvez accéder, corriger ou supprimer vos données. Contact : contact@facturpeyi.fr</p>

      <h2 className="text-xl mt-6 font-semibold">6. Cookies</h2>
      <p>Notre site utilise des cookies pour améliorer la navigation. Voir la <a href="/cookies" className="text-blue-600 underline">politique de cookies</a>.</p>
    </main>
  );
}