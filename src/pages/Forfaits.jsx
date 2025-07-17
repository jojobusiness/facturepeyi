import { useState } from "react";

export default function Forfaits() {
  const [loading, setLoading] = useState("");

  // ⚡️ Lancer le paiement Stripe Checkout
  const handleCheckout = async (priceId) => {
    setLoading(priceId); // Pour savoir quel bouton spinner
    try {
      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId })
      });

      const data = await res.json();
      if (data.url) {
        window.location = data.url;
      } else {
        alert("Erreur de paiement.");
        setLoading("");
      }
    } catch (err) {
      alert("Erreur lors de la redirection vers le paiement.");
      setLoading("");
    }
  };

  // À remplir avec TES vrais Price ID Stripe (dashboard > Produits > Prix > ID commençant par price_)
  const STANDARD_PRICE_ID = "price_1Rlat8Ick4iMBRE91vyvhOFc"; 
  const PREMIUM_PRICE_ID = "price_1RlatdIck4iMBRE9fWyZausA";

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center py-16">
      <div className="max-w-2xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        <ForfaitCard
          title="Standard"
          price="29,99"
          features={["Factures illimitées", "Gestion des dépenses", "Support email"]}
          onSubscribe={() => handleCheckout(STANDARD_PRICE_ID)}
          loading={loading === STANDARD_PRICE_ID}
        />
        <ForfaitCard
          title="Premium"
          price="49,99"
          features={["Toutes les fonctionnalités Standard", "Ajout d'utilisateurs", "Support prioritaire", "Export avancé"]}
          onSubscribe={() => handleCheckout(PREMIUM_PRICE_ID)}
          loading={loading === PREMIUM_PRICE_ID}
          highlight
        />
      </div>
    </main>
  );
}

function ForfaitCard({ title, price, features, onSubscribe, loading, highlight }) {
  return (
    <div className={`bg-white rounded-xl shadow p-8 flex flex-col items-center border-2 ${highlight ? "border-yellow-500 scale-105" : "border-transparent"} transition`}>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <div className="text-4xl font-extrabold mb-4">{price}€<span className="text-lg font-normal">/mois</span></div>
      <ul className="mb-6 space-y-2">
        {features.map(f => <li key={f} className="text-gray-700">✔️ {f}</li>)}
      </ul>
      <button
        disabled={loading}
        className="bg-[#1B5E20] text-white px-6 py-3 rounded font-semibold hover:bg-green-800 transition text-center block w-full disabled:opacity-60"
        onClick={onSubscribe}
      >
        {loading ? "Redirection..." : "Payer et commencer"}
      </button>
    </div>
  );
}