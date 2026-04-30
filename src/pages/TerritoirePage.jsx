import { Link, useLocation, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaCheckCircle, FaFileInvoice, FaReceipt, FaChartBar, FaBell, FaMobileAlt, FaArrowRight } from "react-icons/fa";
import { SEO_TERRITORIES } from "../lib/seo-territories";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <span className="text-xl font-black text-[#0d1b3e] tracking-tight">Factur'Peyi</span>
          <span className="hidden sm:inline text-xs text-gray-400 ml-2">Gérez. Facturez. Encaissez.</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition hidden sm:block">
            Se connecter
          </Link>
          <Link to="/Forfaits" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition">
            Essai gratuit
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#0d1b3e] text-white/60 py-10 px-4 mt-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <div>
          <span className="font-black text-white text-lg tracking-tight">Factur'Peyi</span>
          <span className="text-emerald-400 ml-2 text-xs">Gérez. Facturez. Encaissez.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-5 text-xs">
          <Link to="/" className="hover:text-white transition">Accueil</Link>
          <Link to="/Forfaits" className="hover:text-white transition">Forfaits</Link>
          <Link to="/support" className="hover:text-white transition">Support</Link>
          <Link to="/conditions" className="hover:text-white transition">CGU</Link>
          <Link to="/confidentialite" className="hover:text-white transition">Confidentialité</Link>
        </div>
        <div className="text-xs">© {new Date().getFullYear()} Factur'Peyi</div>
      </div>
    </footer>
  );
}

// ─── Color config ─────────────────────────────────────────────────────────────

const TVA_COLORS = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-800",  badge: "bg-purple-100 text-purple-700",  dot: "bg-purple-500" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  badge: "bg-orange-100 text-orange-700",  dot: "bg-orange-500" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TerritoirePage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "");
  const t = SEO_TERRITORIES[slug];

  if (!t) return <Navigate to="/" replace />;

  const colors = TVA_COLORS[t.tvaColor] || TVA_COLORS.emerald;

  const features = [
    {
      icon: <FaFileInvoice className="w-5 h-5" />,
      title: "Facturation conforme",
      desc: `TVA ${t.tvaRate} appliquée automatiquement sur chaque facture. Mention légale et PDF professionnel générés en un clic.`,
    },
    {
      icon: <FaReceipt className="w-5 h-5" />,
      title: "Gestion des dépenses",
      desc: t.octroiDeMer
        ? "Enregistrez vos achats avec l'Octroi de mer intégré. Catégorisez et totalisez pour votre déclaration fiscale."
        : "Enregistrez vos achats, catégorisez-les et suivez vos charges en temps réel.",
    },
    {
      icon: <FaBell className="w-5 h-5" />,
      title: "Rappels automatiques",
      desc: "Relancez vos clients automatiquement à J+7, J+15 et J+30. Réduisez les impayés sans effort.",
    },
    {
      icon: <FaChartBar className="w-5 h-5" />,
      title: "Déclaration fiscale",
      desc: `Journal comptable, bilan, déclaration TVA et calendrier fiscal adaptés aux spécificités de ${t.name}.`,
    },
    {
      icon: <FaMobileAlt className="w-5 h-5" />,
      title: "100% mobile & web",
      desc: "Accessible depuis votre téléphone, tablette ou ordinateur. Aucune installation, vos données synchronisées partout.",
    },
    {
      icon: <FaFileInvoice className="w-5 h-5" />,
      title: "Devis & conversion",
      desc: "Créez un devis, envoyez-le au client, et convertissez-le en facture en un seul clic.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">

      <Helmet>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta property="og:title" content={t.title} />
        <meta property="og:description" content={t.description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://facturepeyi.com/${slug}`} />
      </Helmet>

      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="text-xl">{t.flag}</span>
            <span>{t.name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0d1b3e] leading-tight mb-5">
            {t.headline}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/Forfaits"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-emerald-200"
            >
              Essai gratuit 30 jours <FaArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/login"
              className="border border-gray-200 text-gray-700 hover:border-gray-300 font-semibold px-6 py-3.5 rounded-xl transition text-sm"
            >
              Se connecter
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Sans carte bancaire · Résiliation à tout moment</p>
        </div>
      </section>

      {/* ── Bloc fiscal ── */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0d1b3e] text-center mb-8">
            Votre fiscalité {t.flag}, gérée automatiquement
          </h2>
          <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6`}>
            <div className="flex flex-wrap gap-3 mb-5">
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full ${colors.badge}`}>
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                TVA {t.tvaRate} — {t.name}
              </span>
              {t.octroiDeMer && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Octroi de mer géré
                </span>
              )}
              {t.mentionLegale && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                  Mention légale auto
                </span>
              )}
            </div>
            <p className={`text-sm leading-relaxed ${colors.text} mb-4`}>{t.fiscalInfo}</p>
            {t.mentionLegale && (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-500 italic">
                Mention sur chaque facture : « {t.mentionLegale} »
              </div>
            )}
            <ul className="mt-4 space-y-2">
              {t.localFacts.map((fact) => (
                <li key={fact} className="flex items-center gap-2 text-sm text-gray-700">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0 w-3.5 h-3.5" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0d1b3e] text-center mb-2">
            Tout ce dont vous avez besoin pour gérer votre activité
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10">
            Factur'Peyi est conçu pour les entrepreneurs et indépendants des DOM-TOM et de {t.name}.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => (
              <div key={feat.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-[#0d1b3e] text-sm mb-1">{feat.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { value: "11", label: "territoires DOM-TOM couverts", sub: "Martinique, Guadeloupe, Guyane et bien d'autres" },
              { value: "100%", label: "conforme au CGI", sub: "TVA, mentions légales, Octroi de mer" },
              { value: "30 j", label: "d'essai gratuit", sub: "Sans carte bancaire, sans engagement" },
            ].map((stat) => (
              <div key={stat.value} className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="text-3xl font-extrabold text-emerald-600 mb-1">{stat.value}</div>
                <div className="font-bold text-[#0d1b3e] text-sm mb-1">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-20 px-4 bg-[#0d1b3e]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">{t.flag}</div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Commencez gratuitement dès aujourd'hui
          </h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            Rejoignez les entrepreneurs de {t.name} qui gèrent leur facturation et comptabilité avec Factur'Peyi. 30 jours d'essai, sans carte bancaire.
          </p>
          <Link
            to="/Forfaits"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl transition text-base inline-flex items-center gap-2 shadow-xl shadow-emerald-900/30"
          >
            Essai gratuit 30 jours <FaArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-xs mt-4">Sans carte bancaire · Résiliation à tout moment</p>
        </div>
      </section>

      <Footer />

    </div>
  );
}
