import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FaFileInvoice, FaChartBar, FaUsers, FaReceipt,
  FaLock, FaMobileAlt, FaCheckCircle, FaChevronDown,
  FaChevronUp, FaWhatsapp, FaArrowRight, FaBolt,
  FaCreditCard, FaBell, FaChartLine
} from "react-icons/fa";
import { HiOutlineDocumentText, HiOutlineCurrencyEuro } from "react-icons/hi";

// ─── Données ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <FaFileInvoice className="w-6 h-6" />,
    title: "Facturation professionnelle",
    desc: "Créez, envoyez et suivez vos factures en quelques clics. Numérotation automatique, PDF conforme.",
  },
  {
    icon: <HiOutlineCurrencyEuro className="w-6 h-6" />,
    title: "TVA DOM-TOM intégrée",
    desc: "Guyane 0%, Martinique 8,5%, Guadeloupe 8,5%, Réunion 8,5%. Mentions légales automatiques.",
  },
  {
    icon: <FaReceipt className="w-6 h-6" />,
    title: "Gestion des dépenses",
    desc: "Enregistrez vos achats, catégorisez-les, importez vos relevés CSV.",
  },
  {
    icon: <FaChartBar className="w-6 h-6" />,
    title: "Comptabilité complète",
    desc: "Journal comptable, bilan, plan comptable, déclaration fiscale — tout en un.",
  },
  {
    icon: <FaUsers className="w-6 h-6" />,
    title: "Multi-utilisateurs",
    desc: "Invitez votre comptable ou votre équipe avec des rôles précis.",
  },
  {
    icon: <FaMobileAlt className="w-6 h-6" />,
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
  },
  {
    name: "Pro",
    price: "34,99€",
    period: "/mois",
    features: ["Tout Solo inclus", "Multi-utilisateurs", "Factures récurrentes", "Portail client Stripe"],
    cta: "Choisir Pro",
    highlight: true,
  },
  {
    name: "Expert",
    price: "54,99€",
    period: "/mois",
    features: ["Tout Pro inclus", "Import bancaire", "Multi-projets", "Support prioritaire"],
    cta: "Choisir Expert",
    highlight: false,
  },
];

const faq = [
  {
    q: "Ça gère vraiment la Guyane sans TVA ?",
    a: "Oui. Si votre territoire est la Guyane ou Mayotte, la TVA est automatiquement mise à 0% et la mention légale «TVA non applicable - art. 294 du CGI» est ajoutée sur chaque facture.",
  },
  {
    q: "Qu'est-ce que l'Octroi de mer ?",
    a: "L'Octroi de mer est une taxe locale sur les importations, spécifique aux DOM. Factur'Peyi intègre un champ dédié dans les dépenses et l'inclut dans votre déclaration fiscale.",
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
    a: "Vos données sont hébergées sur Firebase (Google Cloud), serveurs européens, avec chiffrement en transit et au repos. Conformité RGPD assurée.",
  },
];

// ─── Sous-composants ──────────────────────────────────────────────────────────

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl bg-white cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-center px-6 py-4">
        <span className="font-semibold text-gray-800 text-sm">{q}</span>
        {open
          ? <FaChevronUp className="text-emerald-600 flex-shrink-0 ml-4 w-3 h-3" />
          : <FaChevronDown className="text-gray-400 flex-shrink-0 ml-4 w-3 h-3" />}
      </div>
      {open && (
        <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">{a}</div>
      )}
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 w-full">
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md text-xs text-gray-400 text-center py-0.5 mx-4 border border-gray-200">
          app.facturpeyi.com/dashboard
        </div>
      </div>
      <div className="flex h-44">
        <div className="w-28 bg-gray-50 border-r border-gray-100 p-2 flex-shrink-0">
          <div className="text-xs font-bold text-emerald-700 mb-2 px-2">Factur'Peyi</div>
          {["Tableau de bord", "Factures", "Devis", "Clients", "Paiements", "Rapports"].map((item, i) => (
            <div key={item} className={`px-2 py-1.5 rounded-lg text-xs mb-0.5 ${i === 0 ? "bg-emerald-600 text-white font-semibold" : "text-gray-500 hover:bg-gray-100"}`}>
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 p-3 overflow-hidden">
          <div className="text-xs font-bold text-gray-700 mb-2">Tableau de bord</div>
          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            {[
              { label: "Chiffre d'affaires", val: "28 450 €", change: "+28%", up: true },
              { label: "Factures payées", val: "18 450 €", change: "+35%", up: true },
              { label: "En attente", val: "5 200 €", change: "-12%", up: false },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-400" style={{fontSize: "9px"}}>{s.label}</div>
                <div className="font-bold text-gray-900 mt-0.5" style={{fontSize: "10px"}}>{s.val}</div>
                <div className={`font-medium ${s.up ? "text-emerald-600" : "text-red-500"}`} style={{fontSize: "9px"}}>{s.change}</div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-400 mb-1.5" style={{fontSize: "9px"}}>Évolution du chiffre d'affaires</div>
            <div className="flex items-end gap-0.5 h-10">
              {[25, 40, 30, 55, 45, 70, 80, 65, 75, 85, 70, 90].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-500 rounded-t opacity-80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-[#0d1b3e] tracking-tight">Factur'Peyi</span>
            <span className="hidden sm:inline text-xs text-gray-400 ml-2">Gérez. Facturez. Encaissez.</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#fonctionnalites" className="hover:text-emerald-700 transition">Fonctionnalités</a>
            <a href="#territoires" className="hover:text-emerald-700 transition">DOM-TOM</a>
            <a href="#tarifs" className="hover:text-emerald-700 transition">Tarifs</a>
            <Link to="/support" className="hover:text-emerald-700 transition">Support</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition hidden sm:block">
              Se connecter
            </Link>
            <Link
              to="/Forfaits"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="pt-16 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center py-10 lg:py-16 lg:min-h-[88vh]">

            {/* ── Côté gauche ── */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 text-sm text-blue-700 font-semibold mb-6">
                <span>🇬🇫</span>
                <span>Conçu pour les pros d'ici · Guyane & Outre-mer</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0d1b3e] leading-[1.08] mb-5 tracking-tight">
                Votre business.<br />
                Vos factures.<br />
                <span className="text-emerald-600 relative">
                  Votre succès.
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
                    <path d="M2 6 Q75 2 150 6 Q225 10 298 4" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  </svg>
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                La solution simple pour créer vos factures,{" "}
                <span className="text-blue-600 font-semibold">encaisser plus vite</span>{" "}
                et développer votre activité — avec la fiscalité DOM-TOM déjà intégrée.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Link
                  to="/Forfaits"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl text-base transition shadow-lg shadow-emerald-100"
                >
                  Créer mon compte gratuitement <FaArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-6">
                <FaCheckCircle className="text-emerald-500 w-3.5 h-3.5" /> Aucune carte bancaire requise
              </p>

              {/* 3 mini-features — desktop seulement */}
              <div className="hidden lg:grid grid-cols-3 gap-3 mt-4">
                {[
                  { icon: "🕐", title: "Gagnez du temps", desc: "Automatisez vos tâches." },
                  { icon: "💸", title: "Payé plus vite", desc: "Relances et paiements auto." },
                  { icon: "📊", title: "Pilotez", desc: "Dashboard en temps réel." },
                ].map(f => (
                  <div key={f.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <span className="text-2xl block mb-2">{f.icon}</span>
                    <div className="font-bold text-xs text-[#0d1b3e] mb-1">{f.title}</div>
                    <div className="text-gray-500 text-xs leading-snug">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Côté droit — Dashboard mockup desktop ── */}
            <div className="hidden lg:flex flex-col justify-center gap-3">
              <DashboardMockup />
              <div className="flex gap-3">
                <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-400 mb-0.5">Paiement reçu</div>
                  <div className="font-extrabold text-[#0d1b3e] text-sm">2 350,00 €</div>
                  <div className="text-xs text-emerald-600 font-semibold">✓ SARL Océanik</div>
                </div>
                <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-400 mb-0.5">Facture envoyée</div>
                  <div className="font-extrabold text-[#0d1b3e] text-sm">1 850,00 €</div>
                  <div className="text-xs text-blue-600 font-semibold">FAC-2024-0125</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dashboard mockup — mobile uniquement ── */}
        <div className="lg:hidden px-4 pb-8">
          <div className="bg-gradient-to-br from-[#e8f5ef] to-[#dbeafe] rounded-2xl p-4">
            <DashboardMockup />
            <div className="flex gap-3 mt-3">
              <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="text-xs text-gray-400 mb-0.5">Paiement reçu</div>
                <div className="font-extrabold text-[#0d1b3e] text-sm">2 350,00 €</div>
                <div className="text-xs text-emerald-600 font-semibold">✓ SARL Océanik</div>
              </div>
              <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="text-xs text-gray-400 mb-0.5">Facture envoyée</div>
                <div className="font-extrabold text-[#0d1b3e] text-sm">1 850,00 €</div>
                <div className="text-xs text-blue-600 font-semibold">FAC-2024-0125</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Barre du bas — 4 features ── */}
        <div className="bg-[#0d1b3e]">
          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <FaBolt />, label: "Factures en 1 min", desc: "Créez et envoyez vos factures facilement." },
              { icon: <FaCreditCard />, label: "Paiements en ligne", desc: "Encaissez par carte ou virement." },
              { icon: <FaBell />, label: "Relances automatiques", desc: "Soyez payé sans avoir à relancer." },
              { icon: <FaChartLine />, label: "Suivi & rapports", desc: "Pilotez votre activité en temps réel." },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{f.label}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bande de confiance ── */}
        <div className="bg-white border-b border-gray-100 py-4 px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><FaLock className="text-gray-400 w-3.5 h-3.5" /> Sécurisé. Fiable. Conçu pour les entrepreneurs.</span>
              <span className="flex items-center gap-1.5"><HiOutlineDocumentText className="text-gray-400 w-4 h-4" /> Vos données sont protégées</span>
              <span className="flex items-center gap-1.5"><FaCheckCircle className="text-gray-400 w-3.5 h-3.5" /> Conforme RGPD</span>
              <span className="flex items-center gap-1.5">🇪🇺 Hébergé en Europe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400 text-sm">{"★★★★★"}</div>
              <span className="text-sm font-semibold text-gray-700">4,9/5</span>
              <span className="text-xs text-gray-400">sur plus de 150 entrepreneurs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          POUR QUI — 4 personas
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">Pour qui ?</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#0d1b3e]">
              Fait pour les entrepreneurs d'ici
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Restaurateurs, freelances, artisans, entrepreneurs BTP — Factur'Peyi s'adapte à votre métier et votre territoire.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                pos: "0% 0%",
                label: "Restaurateurs & Cafés",
                desc: "Facturez vos fournisseurs et suivez vos marges en temps réel.",
                color: "from-orange-500/80 to-orange-700/80",
                badge: "🍽️",
              },
              {
                pos: "100% 0%",
                label: "Freelances & Consultants",
                desc: "Créez des devis pro, convertissez-les en factures en 1 clic.",
                color: "from-emerald-500/80 to-emerald-700/80",
                badge: "💻",
              },
              {
                pos: "0% 100%",
                label: "Artisans & Mécaniciens",
                desc: "Gérez vos bons de commande et encaissez sans paperasse.",
                color: "from-blue-500/80 to-blue-700/80",
                badge: "🔧",
              },
              {
                pos: "100% 100%",
                label: "Entrepreneurs BTP",
                desc: "Suivez vos chantiers, facturez vos acomptes, pilotez vos projets.",
                color: "from-yellow-500/80 to-yellow-700/80",
                badge: "🏗️",
              },
            ].map((p) => (
              <div
                key={p.label}
                className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer h-72"
              >
                <div
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: "url('/personas.png')",
                    backgroundSize: "200% 200%",
                    backgroundPosition: p.pos,
                  }}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${p.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 text-2xl bg-white/20 backdrop-blur-sm rounded-xl w-10 h-10 flex items-center justify-center">
                  {p.badge}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="font-bold text-white text-base leading-tight mb-1">{p.label}</div>
                  <div className="text-white/80 text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/Forfaits"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-emerald-100 text-sm"
            >
              Commencer gratuitement <FaArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-emerald-700 font-semibold text-sm uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#0d1b3e]">Tout ce dont votre entreprise a besoin</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Un seul outil pour gérer votre facturation, votre comptabilité et vos obligations fiscales DOM-TOM.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition bg-white group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 mb-4 group-hover:bg-emerald-100 transition">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#0d1b3e] mb-2">{f.title}</h3>
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
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#0d1b3e]">
              Là où QuickBooks ne va pas,<br className="hidden sm:block" />
              <span className="text-emerald-600">Factur'Peyi est déjà là.</span>
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
                  <div className="font-bold text-[#0d1b3e]">{t.name}</div>
                  <div className="text-emerald-600 font-semibold text-sm mt-0.5">TVA {t.tva}</div>
                  <div className="text-gray-400 text-xs mt-1">{t.note}</div>
                </div>
              </div>
            ))}
            <div className="bg-[#0d1b3e] rounded-2xl p-5 flex items-center justify-center text-white text-center">
              <div>
                <div className="font-bold text-lg">+ Haïti, Caraïbes</div>
                <div className="text-gray-400 text-sm mt-1">Expansion 2027</div>
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
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#0d1b3e]">Factur'Peyi vs les autres</h2>
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
                    <td className="px-6 py-3 text-center">{fp ? <span className="text-emerald-600 font-bold text-base">✓</span> : <span className="text-gray-200 text-base">✗</span>}</td>
                    <td className="px-6 py-3 text-center">{qb ? <span className="text-emerald-600 font-bold text-base">✓</span> : <span className="text-gray-200 text-base">✗</span>}</td>
                    <td className="px-6 py-3 text-center">{pl ? <span className="text-emerald-600 font-bold text-base">✓</span> : <span className="text-gray-200 text-base">✗</span>}</td>
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
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#0d1b3e]">Commencez gratuitement, évoluez à votre rythme</h2>
            <p className="text-gray-500 mt-3">Sans engagement. Annulable à tout moment.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(p => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  p.highlight
                    ? "bg-[#0d1b3e] text-white shadow-2xl ring-2 ring-emerald-600"
                    : "bg-white border border-gray-100 shadow-sm"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Le plus populaire
                  </div>
                )}
                <div className={`text-sm font-semibold mb-1 ${p.highlight ? "text-emerald-400" : "text-emerald-700"}`}>{p.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-extrabold ${p.highlight ? "text-white" : "text-[#0d1b3e]"}`}>{p.price}</span>
                  <span className="text-sm text-gray-400">{p.period}</span>
                </div>
                <ul className={`mt-4 mb-6 space-y-2 flex-1 text-sm ${p.highlight ? "text-gray-300" : "text-gray-600"}`}>
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <FaCheckCircle className={`flex-shrink-0 mt-0.5 ${p.highlight ? "text-emerald-400" : "text-emerald-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/Forfaits"
                  className={`text-center font-semibold py-3 rounded-xl transition text-sm ${
                    p.highlight
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : p.trial
                        ? "bg-[#0d1b3e] hover:bg-[#1a2744] text-white"
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
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#0d1b3e]">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {faq.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm mb-3">Vous ne trouvez pas la réponse ?</p>
            <Link to="/support" className="inline-flex items-center gap-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-xl transition text-sm">
              Consulter le support complet <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 px-4 bg-[#0d1b3e] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Prêt à gérer votre entreprise comme un pro ?</h2>
          <p className="text-gray-400 text-lg mb-8">30 jours gratuits. Sans carte bancaire. Annulable à tout moment.</p>
          <Link
            to="/Forfaits"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-10 py-4 rounded-xl text-lg shadow-lg transition"
          >
            Commencer gratuitement <FaArrowRight />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <FaWhatsapp className="text-green-400 text-lg" />
            <span>Support WhatsApp Business disponible</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#080f1e] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 sm:col-span-1">
            <div className="font-black text-xl text-yellow-400 mb-1">Factur'Peyi</div>
            <div className="text-gray-500 text-xs mb-3">Gérez. Facturez. Encaissez.</div>
            <p className="text-gray-600 text-xs leading-relaxed">
              Le logiciel de facturation pensé pour les entrepreneurs des DOM-TOM.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Produit</h4>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#fonctionnalites" className="hover:text-white transition">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="hover:text-white transition">Tarifs</a></li>
              <li><Link to="/Forfaits" className="hover:text-white transition">Commencer</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Se connecter</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Territoires</h4>
            <ul className="space-y-2 text-gray-500">
              <li>🇲🇶 Martinique</li>
              <li>🇬🇵 Guadeloupe</li>
              <li>🇬🇫 Guyane française</li>
              <li>🇷🇪 La Réunion</li>
              <li>🇾🇹 Mayotte</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Aide & Légal</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/support" className="hover:text-white transition">Support</Link></li>
              <li><Link to="/conditions" className="hover:text-white transition">Conditions générales</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white transition">Confidentialité</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition">Cookies</Link></li>
              <li><a href="mailto:contact@facturpeyi.com" className="hover:text-white transition">contact@facturpeyi.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Factur'Peyi — Tous droits réservés · Entreprise française
        </div>
      </footer>

    </div>
  );
}
