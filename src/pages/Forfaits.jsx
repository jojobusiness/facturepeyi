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
          paymentLink="https://buy.stripe.com/28E4gzfVJfhJ2Uh0lR2sM00"
        />
        <ForfaitCard
          title="Premium"
          price="49,99"
          features={["Toutes les fonctionnalités Standard", "Ajout d'utilisateurs", "Support prioritaire", "Export avancé"]}
          paymentLink="https://buy.stripe.com/6oUfZh9xl9Xp2Uh4C72sM01"
          highlight
        />
      </div>
    </main>
  );
}

function ForfaitCard({ title, price, features, paymentLink, highlight }) {
  return (
    <div className={`bg-white rounded-xl shadow p-8 flex flex-col items-center border-2 ${highlight ? "border-yellow-500 scale-105" : "border-transparent"} transition`}>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <div className="text-4xl font-extrabold mb-4">{price}€<span className="text-lg font-normal">/mois</span></div>
      <ul className="mb-6 space-y-2">
        {features.map(f => <li key={f} className="text-gray-700">✔️ {f}</li>)}
      </ul>
      <a
        href={paymentLink}
        className="bg-[#1B5E20] text-white px-6 py-3 rounded font-semibold hover:bg-green-800 transition text-center block w-full"
        target="_blank" rel="noopener noreferrer"
      >
        Payer et commencer
      </a>
    </div>
  );
}