import { useEffect, useState } from "react";
import {
  collection, getDocs, query, orderBy, deleteDoc,
  doc, getDoc, updateDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { downloadInvoicePDF, getInvoicePDFBase64 } from "../utils/downloadPDF";
import { sendEmail } from "../lib/email";
import { useAuth } from "../context/AuthContext";
import { canUseFeature } from "../lib/plans";
import { FaSync, FaLink, FaCheck, FaEnvelope } from "react-icons/fa";

function safeDate(d) {
  if (!d) return "—";
  try {
    const date = typeof d.toDate === "function" ? d.toDate() : new Date(d);
    return isNaN(date) ? "—" : date.toLocaleDateString("fr-FR");
  } catch {
    return "—";
  }
}

const STATUS_CONFIG = {
  "en attente": { label: "En attente", classes: "bg-yellow-50 text-yellow-700" },
  "payée":      { label: "Payée",      classes: "bg-emerald-50 text-emerald-700" },
  "en retard":  { label: "En retard",  classes: "bg-red-50 text-red-600" },
  "annulée":    { label: "Annulée",    classes: "bg-gray-100 text-gray-500" },
};

export default function InvoiceList() {
  const { user, entrepriseId, entreprise } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [sentId, setSentId] = useState(null);
  const navigate = useNavigate();

  const canPortail = canUseFeature(entreprise?.plan || "decouverte", "portail-client");
  const canAcompte = canUseFeature(entreprise?.plan || "decouverte", "acompte");
  const stripeConnected = !!entreprise?.stripeConnectedAccountId;
  const canSharePaymentLink = canPortail && stripeConnected;

  useEffect(() => {
    if (!entrepriseId) return;
    const q = query(collection(db, "entreprises", entrepriseId, "factures"), orderBy("createdAt", "desc"));
    getDocs(q).then((snap) => {
      setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [entrepriseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "factures", id));
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  async function loadInvoiceContext(invoice) {
    const logoUrl = entreprise?.logo || "";
    let logoDataUrl = "";
    if (logoUrl) {
      try {
        const proxyUrl = "/api/logo-proxy?url=" + encodeURIComponent(logoUrl);
        const res = await fetch(proxyUrl);
        logoDataUrl = await res.text();
      } catch {
        logoDataUrl = "";
      }
    }
    let clientData = {};
    if (invoice.clientId) {
      const clientSnap = await getDoc(doc(db, "entreprises", entrepriseId, "clients", invoice.clientId));
      if (clientSnap.exists()) clientData = clientSnap.data();
    }
    return {
      ...invoice,
      clientNom: clientData.nom || invoice.clientNom || "Client inconnu",
      clientAdresse: clientData.adresse || "",
      clientEmail: clientData.email || invoice.clientEmail || "",
      entrepriseNom: entreprise?.nom || "Nom Entreprise",
      entrepriseSiret: entreprise?.siret || "SIRET inconnu",
      entrepriseAdresse: entreprise?.adresse || "",
      logoDataUrl,
    };
  }

  const handleGeneratePDF = async (invoice) => {
    if (!entrepriseId) return;
    try {
      const ctx = await loadInvoiceContext(invoice);
      await downloadInvoicePDF(ctx);
    } catch (err) {
      console.error(err);
      alert("Erreur chargement des données pour le PDF.");
    }
  };

  async function ensurePaymentLink(invoice) {
    if (!canSharePaymentLink) return null;
    let token = invoice.paymentToken;
    if (!token) {
      token = crypto.randomUUID();
      await setDoc(doc(db, "paymentLinks", token), {
        entrepriseId,
        factureId: invoice.id,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "entreprises", entrepriseId, "factures", invoice.id), {
        paymentToken: token,
      });
      setInvoices((prev) =>
        prev.map((inv) => inv.id === invoice.id ? { ...inv, paymentToken: token } : inv)
      );
    }
    return `${window.location.origin}/portail/${token}`;
  }

  const handleCopyPaymentLink = async (invoice) => {
    if (!canPortail) {
      alert("Le portail client est disponible à partir du plan Pro. Mettez à jour votre abonnement.");
      return;
    }
    if (!stripeConnected) {
      alert("Connectez d'abord votre compte Stripe dans Paramètres → Portail paiement pour pouvoir partager un lien de paiement.");
      return;
    }
    const link = await ensurePaymentLink(invoice);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      prompt("Copiez ce lien de paiement :", link);
    }
    setCopiedId(invoice.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendByEmail = async (invoice) => {
    if (!entrepriseId) return;

    const ctx = await loadInvoiceContext(invoice);
    const defaultEmail = ctx.clientEmail || "";
    const to = window.prompt(
      "Envoyer la facture à l'adresse :",
      defaultEmail
    );
    if (!to) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      alert("Adresse email invalide.");
      return;
    }

    setSendingId(invoice.id);
    try {
      const isPayable = invoice.status !== "payée" && invoice.status !== "annulée";
      const paymentLink = isPayable ? await ensurePaymentLink(invoice) : null;

      const pdfBase64 = await getInvoicePDFBase64(ctx);
      const numeroFacture = `FAC-${invoice.id.slice(0, 8).toUpperCase()}`;
      const montant = `${Number(invoice.totalTTC ?? 0).toFixed(2)} €`;

      await sendEmail(
        "invoice_sent",
        to,
        {
          clientNom: ctx.clientNom,
          montant,
          numeroFacture,
          lienFacture: paymentLink || "",
          entrepriseNom: ctx.entrepriseNom,
        },
        {
          attachments: [{ filename: `${numeroFacture}.pdf`, content: pdfBase64 }],
          replyTo: user?.email || undefined,
        }
      );

      await updateDoc(doc(db, "entreprises", entrepriseId, "factures", invoice.id), {
        lastSentAt: serverTimestamp(),
        lastSentTo: to,
      });
      setInvoices((prev) =>
        prev.map((inv) => inv.id === invoice.id ? { ...inv, lastSentTo: to } : inv)
      );

      setSentId(invoice.id);
      setTimeout(() => setSentId(null), 2500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de l'email : " + (err?.message || "inconnue"));
    } finally {
      setSendingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Factures</h2>
          <p className="text-sm text-gray-400 mt-0.5">{invoices.length} facture{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {canAcompte && (
            <Link
              to="/dashboard/facture/acompte/nouvelle"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
            >
              Acompte
            </Link>
          )}
          <Link
            to="/dashboard/facture/nouvelle"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            + Nouvelle facture
          </Link>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-gray-500 font-medium">Aucune facture pour l'instant</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Créez votre première facture en quelques clics</p>
          <Link to="/dashboard/facture/nouvelle" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            Créer une facture
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant TTC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((invoice) => {
                const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG["en attente"];
                const isPayable = invoice.status !== "payée" && invoice.status !== "annulée";
                const isAcompte = invoice.type === "acompte";
                const isSolde = invoice.type === "solde";
                const sending = sendingId === invoice.id;
                const sent = sentId === invoice.id;

                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-[#0d1b3e]">{invoice.clientNom || "—"}</span>
                        {invoice.recurrenceId && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                            <FaSync className="w-2 h-2" /> Auto
                          </span>
                        )}
                        {isAcompte && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                            Acompte {invoice.acomptePercent}%
                          </span>
                        )}
                        {isSolde && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-100">
                            Solde
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate hidden md:table-cell">{invoice.description}</td>
                    <td className="px-5 py-4 font-semibold text-[#0d1b3e]">{invoice.totalTTC?.toFixed(2)} €</td>
                    <td className="px-5 py-4 text-gray-400 hidden sm:table-cell">
                      {safeDate(invoice.date)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => navigate(`/dashboard/facture/modifier/${invoice.id}`)}
                          className="text-xs font-medium text-gray-500 hover:text-[#0d1b3e] transition"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(invoice)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleSendByEmail(invoice)}
                          disabled={sending}
                          title={canSharePaymentLink ? "Envoyer la facture par email (avec lien de paiement)" : "Envoyer la facture par email"}
                          className={`flex items-center gap-1 text-xs font-medium transition ${
                            sent
                              ? "text-emerald-600"
                              : "text-[#0d1b3e] hover:text-emerald-600"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {sending
                            ? "Envoi..."
                            : sent
                              ? <><FaCheck className="w-3 h-3" /> Envoyé</>
                              : <><FaEnvelope className="w-3 h-3" /> Envoyer</>
                          }
                        </button>
                        {isPayable && canSharePaymentLink && (
                          <button
                            onClick={() => handleCopyPaymentLink(invoice)}
                            title={copiedId === invoice.id ? "Lien copié !" : "Copier le lien de paiement"}
                            className={`flex items-center gap-1 text-xs font-medium transition ${
                              copiedId === invoice.id
                                ? "text-emerald-600"
                                : "text-blue-500 hover:text-blue-700"
                            }`}
                          >
                            {copiedId === invoice.id
                              ? <><FaCheck className="w-3 h-3" /> Copié</>
                              : <><FaLink className="w-3 h-3" /> Lien</>
                            }
                          </button>
                        )}
                        {isAcompte && !invoice.soldeFactureId && (
                          <button
                            onClick={() => {
                              if (!canAcompte) {
                                alert("Disponible sur plan Pro+.");
                                return;
                              }
                              navigate(`/dashboard/facture/solde/${invoice.id}`);
                            }}
                            className="text-xs font-medium text-violet-500 hover:text-violet-700 transition"
                          >
                            Solde
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-600 transition"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
