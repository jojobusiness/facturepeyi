import { Link } from "react-router-dom";
import { FaCheckCircle, FaMobileAlt, FaUserTie, FaShieldAlt } from "react-icons/fa";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* HERO */}
      <section className="bg-[#1B5E20] text-white py-20 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Factur’Peyi</h1>
        <p className="text-xl mb-6">💼 La comptabilité simple, locale et efficace en Guyane française.</p>
        <Link to="/login" className="bg-yellow-400 text-[#1B5E20] font-bold px-6 py-3 rounded shadow hover:bg-yellow-300 transition">
          Commencer maintenant
        </Link>
      </section>

      {/* POUR QUI */}
      <section className="max-w-5xl mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-8">Pensé pour les pros d’ici</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          <Card icon={<FaUserTie size={30} />} label="Artisans & indépendants" />
          <Card icon={<FaMobileAlt size={30} />} label="100% mobile et simple" />
          <Card icon={<FaShieldAlt size={30} />} label="Conforme à la TVA DOM" />
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section className="bg-gray-100 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-8">📋 Ce que vous pouvez faire</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Feature text="Créer et envoyer des factures" />
          <Feature text="Gérer vos dépenses et votre compta" />
          <Feature text="Suivre les paiements et relancer" />
          <Feature text="Exporter vos documents en PDF" />
          <Feature text="Ajouter des employés ou comptables" />
          <Feature text="Accéder à tout depuis votre téléphone" />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Rejoignez la révolution locale</h2>
        <p className="mb-6">Factur’Peyi est là pour vous simplifier la vie. Commencer dès aujourd’hui.</p>
        <Link to="/login" className="bg-[#1B5E20] text-white px-6 py-3 rounded shadow hover:bg-green-800 transition">
          Se connecter / S’inscrire
        </Link>
      </section>
    </main>
  );
}

function Card({ icon, label }) {
  return (
    <div className="bg-white p-6 rounded shadow text-center">
      <div className="text-[#1B5E20] mb-3">{icon}</div>
      <p className="font-semibold">{label}</p>
    </div>
  );
}

function Feature({ text }) {
  return (
    <div className="bg-white p-4 rounded shadow flex items-center space-x-3">
      <FaCheckCircle className="text-[#1B5E20]" />
      <span>{text}</span>
    </div>
  );
}
