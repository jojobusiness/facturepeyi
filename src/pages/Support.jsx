import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaWhatsapp, FaEnvelope, FaChevronDown, FaChevronUp,
  FaArrowLeft, FaCheckCircle, FaClock, FaHeadset
} from "react-icons/fa";

const FORMSPREE_URL = "https://formspree.io/f/xanbywyy";

const faq = [
  {
    cat: "Facturation",
    items: [
      { q: "Comment créer ma première facture ?", a: "Connectez-vous, cliquez sur «Créer une facture» dans le menu, remplissez les infos client et les lignes de produit. La facture est générée en PDF automatiquement." },
      { q: "Puis-je personnaliser le numéro de facture ?", a: "Oui. La numérotation suit le format FAC-AAAA-XXX et peut être configurée dans les Paramètres de votre compte." },
      { q: "Comment envoyer une facture à mon client ?", a: "Depuis la liste des factures, cliquez sur la facture et utilisez le bouton «Télécharger PDF». L'envoi par email direct depuis l'interface est en cours de développement." },
    ],
  },
  {
    cat: "Fiscalité DOM-TOM",
    items: [
      { q: "La TVA à 0% en Guyane est-elle gérée automatiquement ?", a: "Oui. Lors de l'inscription, sélectionnez «Guyane française» comme territoire. La TVA est automatiquement mise à 0% et la mention légale «TVA non applicable - art. 294 du CGI» est ajoutée sur chaque facture." },
      { q: "Qu'est-ce que l'Octroi de mer et comment le déclarer ?", a: "L'Octroi de mer est une taxe locale sur les importations applicable en Martinique, Guadeloupe, Réunion et Guyane. Vous trouverez un champ dédié dans le formulaire de dépenses et il apparaît dans votre déclaration fiscale." },
      { q: "Je suis auto-entrepreneur, quelle mention légale s'applique ?", a: "Pour les auto-entrepreneurs, la mention «TVA non applicable, art. 293 B du CGI» est automatiquement appliquée si vous sélectionnez le régime auto-entrepreneur dans vos paramètres." },
    ],
  },
  {
    cat: "Compte & Abonnement",
    items: [
      { q: "Comment annuler mon abonnement ?", a: "Vous pouvez annuler à tout moment depuis Paramètres > Abonnement. L'accès reste actif jusqu'à la fin de la période payée." },
      { q: "Comment inviter mon comptable ?", a: "Depuis Paramètres > Équipe, envoyez une invitation par email à votre comptable. Il aura accès uniquement aux modules comptables avec le rôle «comptable»." },
      { q: "Mes données sont-elles supprimées si j'annule ?", a: "Non. Vos données sont conservées 12 mois après l'annulation. Vous pouvez les exporter à tout moment au format Excel ou PDF." },
    ],
  },
];

function FAQAccordion() {
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen(open === key ? null : key);
  return (
    <div className="space-y-8">
      {faq.map(cat => (
        <div key={cat.cat}>
          <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3">{cat.cat}</h3>
          <div className="space-y-2">
            {cat.items.map((item, i) => {
              const key = `${cat.cat}-${i}`;
              return (
                <div
                  key={key}
                  className="border border-gray-200 rounded-xl bg-white cursor-pointer"
                  onClick={() => toggle(key)}
                >
                  <div className="flex justify-between items-center px-5 py-4">
                    <span className="font-medium text-gray-800 text-sm">{item.q}</span>
                    {open === key
                      ? <FaChevronUp className="text-emerald-600 flex-shrink-0 ml-4 w-3 h-3" />
                      : <FaChevronDown className="text-gray-400 flex-shrink-0 ml-4 w-3 h-3" />
                    }
                  </div>
                  {open === key && (
                    <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactFormBlock() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        body: new FormData(e.target),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setSent(true);
        setError(null);
        e.target.reset();
      } else {
        setError("Erreur lors de l'envoi. Réessayez ou contactez-nous par WhatsApp.");
      }
    } catch {
      setError("Erreur de connexion. Contactez-nous directement par email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Envoyer un message</h2>
      <p className="text-sm text-gray-500 mb-6">On vous répond sous 24h ouvrées.</p>

      {sent ? (
        <div className="flex flex-col items-center text-center py-8 gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <FaCheckCircle className="text-emerald-600 w-7 h-7" />
          </div>
          <p className="font-semibold text-gray-800">Message envoyé !</p>
          <p className="text-sm text-gray-500">On revient vers vous dans les 24h ouvrées.</p>
          <button onClick={() => setSent(false)} className="text-sm text-emerald-700 hover:underline mt-2">
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Prénom</label>
              <input name="prenom" required placeholder="Jean" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nom</label>
              <input name="nom" required placeholder="Dupont" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Adresse email</label>
            <input name="email" type="email" required placeholder="jean@monentreprise.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Sujet</label>
            <select name="sujet" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-700">
              <option value="question">Question sur le produit</option>
              <option value="bug">Signaler un bug</option>
              <option value="facturation">Problème de facturation / abonnement</option>
              <option value="partenariat">Partenariat</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Message</label>
            <textarea name="message" required placeholder="Décrivez votre demande en détail..." rows={5} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition"
          >
            {loading ? "Envoi en cours..." : "Envoyer le message"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-emerald-700 tracking-tight">Factur'Peyi</Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-500 hover:text-emerald-700 transition flex items-center gap-1.5">
              <FaArrowLeft className="w-3 h-3" /> Retour à l'accueil
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a3828] to-[#0f5c3c] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-5">
            <FaHeadset className="text-yellow-400" /> Support client
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Comment pouvons-nous vous aider ?</h1>
          <p className="text-emerald-200">
            Une question sur votre facturation, la fiscalité DOM-TOM ou votre abonnement ? On est là.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <a
              href="https://wa.me/+596XXXXXXXX"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              <FaWhatsapp className="w-5 h-5" /> WhatsApp Business
            </a>
            <a
              href="mailto:contact@facturpeyi.com"
              className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              <FaEnvelope className="w-4 h-4" /> contact@facturpeyi.com
            </a>
          </div>
        </div>
      </section>

      {/* SLA banners */}
      <div className="max-w-5xl mx-auto px-4 -mt-6 mb-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: <FaClock className="text-emerald-600 w-5 h-5" />, title: "Réponse sous 24h", desc: "Du lundi au vendredi, 8h–18h" },
            { icon: <FaWhatsapp className="text-green-500 w-5 h-5" />, title: "WhatsApp Business", desc: "Réponse rapide pour les urgences" },
            { icon: <FaHeadset className="text-blue-600 w-5 h-5" />, title: "Support prioritaire", desc: "Inclus dans le plan Expert" },
          ].map(c => (
            <div key={c.title} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{c.icon}</div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{c.title}</div>
                <div className="text-gray-500 text-xs mt-0.5">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto px-4 pb-20 grid lg:grid-cols-2 gap-10">
        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Questions fréquentes</h2>
          <p className="text-sm text-gray-500 mb-6">La réponse est peut-être déjà là.</p>
          <FAQAccordion />
        </div>

        {/* Formulaire */}
        <div>
          <ContactFormBlock />

          <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-sm text-emerald-800">
            <strong>Vous êtes comptable ou expert-comptable ?</strong> Vous gérez plusieurs dossiers clients et souhaitez un accès partenaire ? Écrivez-nous avec le sujet «Partenariat» — on a un plan Cabinet à 199€/mois pour vous.
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="bg-[#0a3828] text-white py-6 px-4 text-center text-sm text-emerald-400">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/" className="hover:text-white transition">Accueil</Link>
          <Link to="/conditions" className="hover:text-white transition">CGU</Link>
          <Link to="/confidentialite" className="hover:text-white transition">Confidentialité</Link>
          <a href="mailto:contact@facturpeyi.com" className="hover:text-white transition">contact@facturpeyi.com</a>
        </div>
        <p className="mt-3 text-xs text-emerald-500">© {new Date().getFullYear()} Factur'Peyi</p>
      </footer>
    </div>
  );
}
