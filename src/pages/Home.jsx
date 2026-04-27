import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FaFileInvoice, FaChartBar, FaUsers, FaReceipt,
  FaLock, FaMobileAlt, FaCheckCircle, FaChevronDown,
  FaChevronUp, FaWhatsapp, FaArrowRight
} from "react-icons/fa";
import { HiOutlineDocumentText, HiOutlineCurrencyEuro } from "react-icons/hi";
import ContactForm from "../components/ContactForm";

// ─── Données ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <FaFileInvoice className="w-7 h-7" />,
    title: "Facturation professionnelle",
    desc: "Créez, envoyez et suivez vos factures en quelques clics. Numérotation automatique, PDF conforme.",
  },
  {
    icon: <HiOutlineCurrencyEuro className="w-7 h-7" />,
    title: "TVA DOM-TOM intégrée",
    desc: "Guyane 0%, Martinique 8,5%, Guadeloupe 8,5%, Réunion 8,5%. Mentions légales automatiques.",
  },
  {
    icon: <FaReceipt className="w-7 h-7" />,
    title: "Gestion des dépenses",
    desc: "Enregistrez vos achats, catégorisez-les, importez vos relevés CSV.",
  },
  {
    icon: <FaChartBar className="w-7 h-7" />,
    title: "Comptabilité complète",
    desc: "Journal comptable, bilan, plan comptable, déclaration fiscale — tout en un.",
  },
  {
    icon: <FaUsers className="w-7 h-7" />,
    title: "Multi-utilisateurs",
    desc: "Invitez votre comptable ou votre équipe avec des rôles précis (admin, comptable, employé).",
  },
  {
    icon: <FaMobileAlt className="w-7 h-7" />,
    title: "100% mobile & web",
    desc: "Fonctionne sur téléphone, tablette et ordinateur. Aucune installation requise.",
  },
];

const territories = [
  { name: "Martinique", tva: "8,5%", note: "Octroi de mer géré", flag: "🇲🇶" },
  { name: "Guadeloupe", tva: "8,5%", note: "Octroi de mer géré", flag: "🇬🇵" },
  { name: "Guyane française", tva: "0%", note: "Art. 294 CGI automatique", flag: "🇬🇫" },
  { name: "La Réunion", tva: "8,5%", note: "Octroi de mer géré", flag: "🇷🇪" },
  { name: "Mayotte", tva: "0%", note: "Art. 294 CGI automatique", flag: "🇾🇹" },
];

const plans = [
  {
    name: "Découverte",
    price: "Gratuit",
    period: "30 jours",
    features: ["Toutes les fonctionnalités", "Jusqu'à 5 factures", "Sans carte bancaire"],
    cta: "Commencer gratuitement",
    highlight: false,
    trial: true,
  },
  {
    name: "Solo",
    price: "19,99€",
    period: "/mois",
    features: ["Factures illimitées", "Devis & rappels", "1 utilisateur", "Support email"],
    cta: "Choisir Solo",
    highlight: false,
    trial: false,
  },
  {
    name: "Pro",
    price: "34,99€",
    period: "/mois",
    features: ["Tout Solo inclus", "Multi-utilisateurs", "Factures récurrentes", "Portail client Stripe"],
    cta: "Choisir Pro",
    highlight: true,
    trial: false,
  },
  {
    name: "Expert",
    price: "54,99€",
    period: "/mois",
    features: ["Tout Pro inclus", "Import bancaire", "Multi-projets", "Support prioritaire"],
    cta: "Choisir Expert",
    highlight: false,
    trial: false,
  },
];

const faq = [
  {
    q: "Ça gère vraiment la Guyane sans TVA ?",
    a: "Oui. Si votre territoire est la Guyane ou Mayotte, la TVA est automatiquement mise à 0% et la mention légale \"TVA non applicable - art. 294 du CGI\" est ajoutée sur chaque facture.",
  },
  {
    q: "Qu'est-ce que l'Octroi de mer ?",
    a: "L'Octroi de mer est une taxe locale sur les importations, spécifique aux DOM (Martinique, Guadeloupe, Réunion, Guyane). Factur'Peyi intègre un champ dédié dans les dépenses et l'inclut dans votre déclaration fiscale.",
  },
  {
    q: "Puis-je essayer sans payer ?",
    a: "Oui. L'offre Découverte vous donne accès à toutes les fonctionnalités pendant 30 jours, sans carte bancaire, jusqu'à 5 factures.",
  },
  {
    q: "Comment inviter mon comptable ?",
    a: "Depuis les paramètres, envoyez une invitation par email. Votre comptable accède uniquement aux modules comptables, sans toucher à vos factures.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Vos données sont stockées sur Firebase (Google Cloud), serveurs européens, avec chiffrement en transit et au repos. Conformité RGPD assurée.",
  },
];

// ─── Composants ─────────────────────────────────────────────────────────────

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-gray-200 rounded-xl bg-white cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center px-6 py-4">
        <span className="font-semibold text-gray-800">{q}</span>
        {open
          ? <FaChevronUp className="text-emerald-600 flex-shrink-0 ml-4" />
          : <FaChevronDown className="text-gray-400 flex-shrink-0 ml-4" />
        }
      </div>
      {open && (
        <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-emerald-700 tracking-tight">Factur'Peyi</span>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#fonctionnalites" className="hover:text-emerald-700 transition">Fonctionnalités</a>
            <a href="#territoires" className="hover:text-emerald-700 transition">DOM-TOM</a>
            <a href="#tarifs" className="hover:text-emerald-700 transition">Tarifs</a>
            <a href="#faq" className="hover:text-emerald-700 transition">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition hidden sm:block">
              Se connecter
            </Link>
            <Link
              to="/Forfaits"
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-gradient-to-br from-[#0a3828] via-[#0f5c3c] to-[#1a7a52]">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: "radial-gradient(circle at 25% 60%, #f4c430 0%, transparent 50%), radial-gradient(circle at 75% 30%, #34d399 0%, transparent 50%)"}}
        />
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Conforme TVA DOM-TOM · RGPD · 100% français
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Le logiciel de gestion<br />
            <span className="text-yellow-400">pensé pour les entrepreneurs des DOM</span>
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Factures, devis, comptabilité, déclarations fiscales — avec la TVA guyanaise, l'Octroi de mer, et toutes les spécificités DOM-TOM déjà intégrées. Là où QuickBooks ne va pas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/Forfaits"
              className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition"
            >
              Essai gratuit 30 jours
              <FaArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#fonctionnalites"
              className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
            >
              Découvrir les fonctionnalités
            </a>
          </div>
          <p className="text-emerald-300 text-sm mt-4">Sans carte bancaire · Annulable à tout moment</p>
        </div>

        {/* Stats */}
        <div className="relative max-w-4xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { n: "163 000", l: "entreprises DOM-TOM ciblées" },
            { n: "5 DOM", l: "territoires supportés" },
            { n: "0 €", l: "pour commencer" },
            { n: "100%", l: "conforme réglementation française" },
          ].map(s => (
            <div key={s.l} className="bg-white/10 border border-white/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-extrabold text-yellow-400">{s.n}</div>
              <div className="text-xs text-emerald-200 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bandeau de confiance ── */}
      <div className="bg-emerald-50 border-y border-emerald-100 py-3 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-emerald-800 font-medium">
          <span className="flex items-center gap-1.5"><FaLock className="text-emerald-600" /> Données hébergées en Europe</span>
          <span className="flex items-center gap-1.5"><FaCheckCircle className="text-emerald-600" /> RGPD conforme</span>
          <span className="flex items-center gap-1.5"><HiOutlineDocumentText className="text-emerald-600" /> Factures légalement conformes</span>
          <span className="flex items-center gap-1.5"><FaCheckCircle className="text-emerald-600" /> TVA DOM-TOM automatique</span>
        </div>
      </div>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Tout ce dont votre entreprise a besoin</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Un seul outil pour gérer votre facturation, votre comptabilité et vos obligations fiscales DOM-TOM.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition bg-white group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4 group-hover:bg-emerald-100 transition">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Avantage DOM-TOM ── */}
      <section id="territoires" className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">Notre avantage</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">
              Là où QuickBooks ne va pas,<br className="hidden sm:block" />
              <span className="text-emerald-700">Factur'Peyi est déjà là.</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Aucun logiciel au monde ne cible les DOM-TOM avec leurs vraies contraintes fiscales. C'est notre territoire.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {territories.map(t => (
              <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition">
                <span className="text-3xl">{t.flag}</span>
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-emerald-700 font-semibold text-sm mt-0.5">TVA {t.tva}</div>
                  <div className="text-gray-400 text-xs mt-1">{t.note}</div>
                </div>
              </div>
            ))}
            <div className="bg-emerald-700 rounded-2xl p-5 flex items-center justify-center text-white text-center">
              <div>
                <div className="font-bold text-lg">+ Haïti, Caraïbes</div>
                <div className="text-emerald-200 text-sm mt-1">Expansion 2027</div>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-yellow-400 rounded-r-xl p-5 shadow-sm">
            <p className="text-gray-700 font-medium">
              "Aucun logiciel concurrent ne connaît l'Octroi de mer, la TVA guyanaise à 0%, ou les régimes micro-BIC/BNC locaux. Factur'Peyi les gère nativement depuis le premier jour."
            </p>
          </div>
        </div>
      </section>

      {/* ── Comparaison ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">Comparaison</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">Factur'Peyi vs les autres</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Fonctionnalité</th>
                  <th className="px-6 py-4 font-bold text-emerald-700">Factur'Peyi</th>
                  <th className="px-6 py-4 font-semibold text-gray-400">QuickBooks</th>
                  <th className="px-6 py-4 font-semibold text-gray-400">Pennylane</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ["TVA DOM-TOM automatique", true, false, false],
                  ["Octroi de mer intégré", true, false, false],
                  ["Interface en français", true, false, true],
                  ["Prix abordable", true, false, false],
                  ["Essai gratuit sans CB", true, true, false],
                  ["Conforme réglementation française", true, false, true],
                  ["Déclaration fiscale DOM", true, false, false],
                ].map(([label, fp, qb, pl]) => (
                  <tr key={label} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-700 font-medium">{label}</td>
                    <td className="px-6 py-3 text-center">{fp ? <span className="text-emerald-600 text-lg">✓</span> : <span className="text-gray-300 text-lg">✗</span>}</td>
                    <td className="px-6 py-3 text-center">{qb ? <span className="text-emerald-600 text-lg">✓</span> : <span className="text-gray-300 text-lg">✗</span>}</td>
                    <td className="px-6 py-3 text-center">{pl ? <span className="text-emerald-600 text-lg">✓</span> : <span className="text-gray-300 text-lg">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section id="tarifs" className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">Tarifs</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Commencez gratuitement, évoluez à votre rythme</h2>
            <p className="text-gray-500 mt-3">Sans engagement. Annulable à tout moment.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(p => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  p.highlight
                    ? "bg-emerald-700 text-white shadow-2xl shadow-emerald-200 ring-2 ring-emerald-600"
                    : "bg-white border border-gray-100 shadow-sm"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className={`text-sm font-semibold mb-1 ${p.highlight ? "text-emerald-200" : "text-emerald-700"}`}>{p.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-extrabold ${p.highlight ? "text-white" : "text-gray-900"}`}>{p.price}</span>
                  <span className={`text-sm ${p.highlight ? "text-emerald-300" : "text-gray-400"}`}>{p.period}</span>
                </div>
                <ul className={`mt-4 mb-6 space-y-2 flex-1 text-sm ${p.highlight ? "text-emerald-100" : "text-gray-600"}`}>
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <FaCheckCircle className={`flex-shrink-0 mt-0.5 ${p.highlight ? "text-yellow-400" : "text-emerald-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/Forfaits"
                  className={`text-center font-semibold py-3 rounded-xl transition text-sm ${
                    p.highlight
                      ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
                      : p.trial
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                        : "border border-emerald-700 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {faq.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#0a3828] to-[#0f5c3c] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Prêt à gérer votre entreprise comme un pro ?</h2>
          <p className="text-emerald-200 text-lg mb-8">30 jours gratuits. Sans carte bancaire. Annulable à tout moment.</p>
          <Link
            to="/Forfaits"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-4 rounded-xl text-lg shadow-lg transition"
          >
            Commencer gratuitement
            <FaArrowRight />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-2 text-emerald-300 text-sm">
            <FaWhatsapp className="text-green-400 text-lg" />
            <span>Support WhatsApp Business disponible</span>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <ContactForm />

      {/* ── Footer ── */}
      <footer className="bg-[#0a3828] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 sm:col-span-1">
            <div className="font-bold text-xl text-yellow-400 mb-3">Factur'Peyi</div>
            <p className="text-emerald-300 text-xs leading-relaxed">
              Le logiciel de facturation et de comptabilité pensé pour les entrepreneurs des DOM-TOM.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-emerald-200">Produit</h4>
            <ul className="space-y-2 text-emerald-300">
              <li><a href="#fonctionnalites" className="hover:text-white transition">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="hover:text-white transition">Tarifs</a></li>
              <li><Link to="/Forfaits" className="hover:text-white transition">Commencer</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Se connecter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-emerald-200">Territoires</h4>
            <ul className="space-y-2 text-emerald-300">
              <li>🇲🇶 Martinique</li>
              <li>🇬🇵 Guadeloupe</li>
              <li>🇬🇫 Guyane française</li>
              <li>🇷🇪 La Réunion</li>
              <li>🇾🇹 Mayotte</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-emerald-200">Légal & Contact</h4>
            <ul className="space-y-2 text-emerald-300">
              <li><Link to="/conditions" className="hover:text-white transition">Conditions générales</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white transition">Confidentialité</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition">Cookies</Link></li>
              <li><a href="mailto:contact@facturpeyi.com" className="hover:text-white transition">contact@facturpeyi.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-emerald-400">
          © {new Date().getFullYear()} Factur'Peyi — Tous droits réservés · Entreprise française
        </div>
      </footer>

    </div>
  );
}
