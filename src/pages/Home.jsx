import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import FAQSection from "../components/FAQSection";
import ContactForm from "../components/ContactForm";

// 📸 Chemins vers les images (à mettre dans /public/assets/)
const artisan = "/assets/artisanat.webp";
const mobile = "/assets/mobile.webp";
const tva = "/assets/TVA.png";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* HERO SECTION */}
      <section className="relative w-full h-[90vh]">
        <img
          src="/entreprise-en-Guyane-francaise-.webp"
          alt="Professionnels en Guyane"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-center text-white px-4">
          <h1 className="text-5xl font-bold mb-4">Factur’Peyi</h1>
          <p className="text-xl text-yellow-300 mb-6">
            💼 La compta simple, locale et efficace en Guyane française.
          </p>
          <Link
            to="/Forfaits"
            className="bg-yellow-400 text-[#1B5E20] font-semibold px-8 py-3 rounded hover:bg-yellow-300 transition"
          >
            Commencer maintenant
          </Link>
        </div>
      </section>

      {/* Bande verte */}
      <div className="bg-[#1B5E20] text-white text-center text-sm py-2">
        Pensé pour les artisans, commerçants & indépendants en Guyane 🇬🇫
      </div>

      {/* POUR QUI */}
      <section className="max-w-6xl mx-auto py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-10">✨ Pensé pour les pros d’ici</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <ForWhoCard img={artisan} label="Artisans & indépendants" />
          <ForWhoCard img={mobile} label="100% mobile et simple" />
          <ForWhoCard img={tva} label="Conforme à la TVA DOM" />
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="bg-gray-50 py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-12">📋 Ce que vous pouvez faire</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
          <Feature text="Créer et envoyer des factures personnalisées" />
          <Feature text="Gérer vos dépenses et votre comptabilité" />
          <Feature text="Suivre les paiements et relancer automatiquement" />
          <Feature text="Exporter vos factures et journaux en PDF" />
          <Feature text="Collaborer avec votre comptable ou équipe" />
          <Feature text="Utiliser sur mobile, tablette ou ordinateur" />
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Rejoignez la révolution locale</h2>
        <p className="mb-6 text-gray-600 text-lg">
          Factur’Peyi est là pour vous simplifier la vie. Commencer dès aujourd’hui.
        </p>
        <Link
          to="/login"
          className="bg-[#1B5E20] text-white px-8 py-3 rounded shadow hover:bg-green-800 transition text-lg font-medium"
        >
          Se connecter / S’inscrire
        </Link>
      </section>

      {/* 🔹 F.A.Q. */}
      <FAQSection />


      {/* 🔹 Contact */}
      <ContactForm />


      <footer className="bg-[#1B5E20] text-white mt-20">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        {/* Liens utiles */}
        <div>
          <h4 className="font-semibold text-lg mb-4">Liens utiles</h4>
        </div>

        {/* Mentions légales */}
        <div>
          <h4 className="font-semibold text-lg mb-4">Mentions légales</h4>
          <ul className="space-y-2">
            <li><a href="/conditions" className="hover:underline">Conditions générales</a></li>
            <li><a href="/confidentialite" className="hover:underline">Politique de confidentialité</a></li>
            <li><a href="/cookies" className="hover:underline">Cookies</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-lg mb-4">Contact</h4>
          <p className="mb-2">📧 contact@facturpeyi.com</p>
          <p>📍 Guyane française</p>
        </div>
      </div>

      <div className="text-center border-t border-white/20 py-4 text-xs">
        © {new Date().getFullYear()} Factur’Peyi – Tous droits réservés 🇬🇫
      </div>
    </footer>

    </main>
  );
}

// ✅ Carte "Pour qui"
function ForWhoCard({ img, label }) {
  return (
    <div className="rounded-lg overflow-hidden shadow hover:shadow-lg transition">
      <img src={img} alt={label} className="h-48 w-full object-cover" />
      <div className="p-4 bg-white">
        <p className="font-semibold text-lg text-[#1B5E20]">{label}</p>
      </div>
    </div>
  );
}

// ✅ Carte fonctionnalité
function Feature({ text }) {
  return (
    <div className="bg-white p-4 rounded shadow flex items-start gap-3">
      <FaCheckCircle className="text-[#1B5E20] mt-1" />
      <span>{text}</span>
    </div>
  );
}
