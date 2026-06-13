import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  FaCheckCircle, FaBolt, FaPercentage, FaShip, FaFileSignature,
  FaBell, FaChartBar, FaCalendarAlt, FaShieldAlt, FaMobileAlt,
  FaChevronDown, FaChevronUp, FaArrowRight,
} from "react-icons/fa";

// ─── Navbar ─────────────────────────────────────────────────────────────────
function Navbar({ onCta }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <span className="text-xl font-black text-[#0d1b3e] tracking-tight">Factur'Peyi</span>
          <span className="hidden sm:inline text-xs text-gray-400 ml-2">Gérez. Facturez. Encaissez.</span>
        </Link>
        <button
          onClick={onCta}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition"
        >
          Essai gratuit
        </button>
      </div>
    </nav>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl bg-white cursor-pointer transition" onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-start px-5 py-4 gap-4">
        <span className="font-semibold text-[#0d1b3e] text-sm leading-snug flex-1">{q}</span>
        {open
          ? <FaChevronUp className="text-emerald-600 flex-shrink-0 mt-1 w-3 h-3" />
          : <FaChevronDown className="text-gray-400 flex-shrink-0 mt-1 w-3 h-3" />}
      </div>
      {open && (
        <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">{a}</div>
      )}
    </div>
  );
}

const FAQS = [
  {
    q: "La facturation électronique est-elle vraiment obligatoire ?",
    a: "Oui. La réforme impose à toutes les entreprises de pouvoir recevoir des factures électroniques dès le 1er septembre 2026, puis aux TPE/PME de les émettre au format structuré (Factur-X) au 1er septembre 2027. Le PDF simple ne suffira plus pour le B2B.",
  },
  {
    q: "C'est quoi Factur-X ?",
    a: "Un format de facture qui combine un PDF lisible et un fichier de données structuré (XML) à l'intérieur du même fichier, conforme à la norme européenne EN 16931. Factur'Peyi génère déjà des factures Factur-X validées PDF/A-3b.",
  },
  {
    q: "C'est adapté à mon régime (auto-entrepreneur, micro-BIC, micro-BNC) ?",
    a: "Oui. Vous choisissez votre territoire et votre régime à l'inscription : la TVA, l'octroi de mer et les mentions légales (art. 294, art. 293 B…) sont appliqués automatiquement sur chaque facture.",
  },
  {
    q: "C'est gratuit ?",
    a: "Vous démarrez gratuitement avec 5 factures, sans carte bancaire. Vous passez à un forfait payant seulement quand vous en avez besoin.",
  },
];

export default function FacturationElectronique2026() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  // Angle de campagne : ?angle=reforme (urgence légale) ou ?angle=domtom (fiscalité).
  // Permet à chaque créa Meta de pointer sur SA promesse sans diluer le message.
  const angle = params.get("angle") === "reforme" ? "reforme" : "domtom";
  // Conserve l'attribution de parrainage si la pub/lien la transporte (ne pas casser la prescription 25%).
  const ref = params.get("ref");

  const startTrial = () => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "Lead", { content_name: `landing-2026-${angle}` });
    }
    navigate("/Inscription", { state: { trialOk: true, ref: ref || null } });
  };

  const hero = angle === "reforme"
    ? {
        h1: <>La facture électronique devient <span className="text-emerald-600">obligatoire</span>. Factur'Peyi est déjà prêt.</>,
        sub: "Le logiciel de facturation conçu pour la Guyane, les Antilles et la Réunion — TVA et mentions légales automatiques selon ton territoire.",
      }
    : {
        h1: <>Le logiciel de facturation <span className="text-emerald-600">conçu pour l'Outre-mer</span>.</>,
        sub: "TVA 8,5 % Antilles-Réunion, 0 % Guyane, octroi de mer, mentions légales par territoire — automatiques. Et déjà prêt pour la réforme de la facture électronique 2026.",
      };

  return (
    <div className="min-h-screen bg-white font-[Inter]">
      <Helmet>
        <title>Facturation électronique 2026 + logiciel DOM-TOM | Factur'Peyi</title>
        <meta
          name="description"
          content="Factur'Peyi : logiciel de facturation conçu pour la Guyane, les Antilles et la Réunion. TVA et octroi de mer automatiques par territoire, factures Factur-X prêtes pour la réforme 2026. Essai gratuit, sans carte."
        />
        <link rel="canonical" href="https://www.facturepeyi.com/facturation-electronique-2026" />
        <meta property="og:title" content="Facturation électronique 2026 + logiciel DOM-TOM | Factur'Peyi" />
        <meta property="og:description" content="Factures Factur-X conformes + fiscalité DOM-TOM automatique. Essai gratuit sans carte." />
        <meta property="og:url" content="https://www.facturepeyi.com/facturation-electronique-2026" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Helmet>

      <Navbar onCta={startTrial} />

      {/* ── HERO ── */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-[#0d1b3e] text-white text-xs font-semibold px-3 py-1 rounded-full mb-5">
            Conçu pour les pros d'ici · Guyane & Outre-mer
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0d1b3e] leading-tight">{hero.h1}</h1>
          <p className="text-gray-600 text-base sm:text-lg mt-5 max-w-2xl mx-auto">{hero.sub}</p>
          <button
            onClick={startTrial}
            className="mt-8 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            Démarrer mon essai gratuit <FaArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-gray-500 mt-3">5 factures gratuites · sans carte bancaire</p>
        </div>
      </section>

      {/* ── BANDEAU URGENCE RÉFORME 2026 ── */}
      <section className="px-4 py-10 bg-[#0d1b3e] text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
          <FaBolt className="text-emerald-400 w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">La réforme 2026 arrive. Sois prêt avant l'échéance, pas dans la panique.</h2>
            <p className="text-white/70 text-sm mt-1 leading-relaxed">
              La facturation électronique entre entreprises devient obligatoire (réception dès le 1<sup>er</sup> septembre 2026,
              émission au format structuré pour les TPE/PME au 1<sup>er</sup> septembre 2027). Factur'Peyi génère déjà des factures
              <strong className="text-white"> Factur-X conformes</strong> (XML embarqué, PDF/A-3b validé) — tu es prêt aujourd'hui.
            </p>
          </div>
        </div>
      </section>

      {/* ── BLOC DOM-TOM (wedge anti-concurrence) ── */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0d1b3e] text-center">
          La fiscalité d'Outre-mer, gérée automatiquement
        </h2>
        <p className="text-gray-600 text-center mt-3 max-w-2xl mx-auto">
          Les logiciels pensés pour la métropole se trompent sur la TVA et l'octroi de mer. Pas Factur'Peyi.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {[
            { icon: <FaPercentage />, t: "TVA automatique par territoire", d: "8,5 % Antilles & Réunion, 0 % Guyane et Mayotte (art. 294 du CGI). Appliquée seule, sans erreur." },
            { icon: <FaShip />, t: "Octroi de mer géré", d: "Pris en compte dans les dépenses et la déclaration fiscale, selon ton territoire." },
            { icon: <FaFileSignature />, t: "Mentions légales auto", d: "Art. 294 ou art. 293 B (auto-entrepreneur) ajoutées automatiquement sur chaque facture." },
            { icon: <FaCheckCircle />, t: "12 territoires configurés", d: "Antilles, Guyane, Réunion, Mayotte, Saint-Martin, Polynésie, Nouvelle-Calédonie…" },
            { icon: <FaCalendarAlt />, t: "Calendrier fiscal DOM", d: "Rappels d'échéances par régime, pour ne plus jamais rater une déclaration." },
            { icon: <FaBolt />, t: "Prêt pour la réforme 2026", d: "Factur-X conforme dès aujourd'hui, sans rien changer à ta façon de travailler." },
          ].map((c, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4">
                {c.icon}
              </div>
              <h3 className="font-bold text-[#0d1b3e]">{c.t}</h3>
              <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FONCTIONNALITÉS CLÉS ── */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0d1b3e] text-center">Tout ce qu'il te faut, déjà inclus</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            {[
              { icon: <FaFileSignature />, t: "Factures & devis conformes", d: "Multi-lignes, conversion devis → facture, PDF pro." },
              { icon: <FaBell />, t: "Relances de paiement automatiques", d: "Rappels J+7 / J+15 / J+30 envoyés tout seuls." },
              { icon: <FaCalendarAlt />, t: "Déclaration fiscale + calendrier", d: "Échéances et déclarations DOM en un coup d'œil." },
              { icon: <FaChartBar />, t: "Tableau de bord CA & impayés", d: "Chiffre d'affaires, factures en retard, taux de recouvrement." },
            ].map((c, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-2xl p-5 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#0d1b3e] text-sm">{c.t}</h3>
                  <p className="text-gray-600 text-sm mt-1">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RÉASSURANCE ── */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-12 text-center">
          {[
            { icon: <FaCheckCircle />, t: "Gratuit pour démarrer", d: "5 factures, aucune carte requise." },
            { icon: <FaShieldAlt />, t: "Données sécurisées", d: "Hébergement européen, conforme RGPD." },
            { icon: <FaMobileAlt />, t: "Sur mobile & ordinateur", d: "Application installable, partout avec toi." },
          ].map((c, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-emerald-600 text-2xl mb-2">{c.icon}</div>
              <div className="font-bold text-[#0d1b3e] text-sm">{c.t}</div>
              <div className="text-gray-500 text-xs mt-1">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0d1b3e] text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 text-center">
        <h2 className="text-2xl sm:text-4xl font-black text-white max-w-2xl mx-auto leading-tight">
          Mets ta facturation aux normes — sans prise de tête.
        </h2>
        <p className="text-emerald-50 mt-4">Crée ton compte en 2 minutes. 5 factures gratuites, sans carte.</p>
        <button
          onClick={startTrial}
          className="mt-8 inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition hover:bg-emerald-50"
        >
          Démarrer mon essai gratuit <FaArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0d1b3e] text-white/60 py-10 px-4">
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

      {/* ── Barre CTA collante mobile ── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t p-3 shadow-lg">
        <button onClick={startTrial} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">
          Démarrer mon essai gratuit
        </button>
      </div>
      <div className="md:hidden h-20" />
    </div>
  );
}
