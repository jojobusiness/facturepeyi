import { useState } from "react";

export default function Forfaits() {
  const [loading, setLoading] = useState(false);

  // ⚡️ Lancer le paiement Stripe Checkout
  const handleCheckout = async (priceId) => {
    setLoading(true);
    // Appelle ton backend qui initialise Stripe Checkout Session
    const res = await fetch("/api/stripe-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId })
    });
    const { url } = await res.json();
    window.location = url; // Redirige vers Stripe Checkout
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center py-16">
      <div className="max-w-2xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        <ForfaitCard
          title="Standard"
          price="29,99"
          features={["Factures illimitées", "Gestion des dépenses", "Support email"]}
          onSubscribe={() => handleCheckout("price_1Rlat8Ick4iMBRE91vyvhOFc")}
          loading={loading}
        />
        <ForfaitCard
          title="Premium"
          price="49,99"
          features={["Toutes les fonctionnalités Standard", "Ajout d'utilisateurs", "Support prioritaire", "Export comptable avancé"]}
          onSubscribe={() => handleCheckout("price_1RlatdIck4iMBRE9fWyZausA")}
          loading={loading}
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
        className="bg-[#1B5E20] text-white px-6 py-3 rounded font-semibold hover:bg-green-800 transition"
        onClick={onSubscribe}
      >
        {loading ? "Redirection..." : "Commencer"}
      </button>
    </div>
  );
}