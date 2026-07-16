import { useEffect, useState } from "react";
import {
  collection, getDocs, query, orderBy,
  deleteDoc, doc, getDoc, updateDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { downloadDevisPDF, getDevisPDFBase64 } from "../utils/downloadPDF";
import { createNumberedInvoice } from "../utils/invoiceNumber";
import { IA_IMPORT_ENABLED } from "../lib/features";
import { sendEmail } from "../lib/email";
import { FaCheck, FaEnvelope } from "react-icons/fa";

const STATUS_CONFIG = {
  brouillon: { label: "Brouillon", classes: "bg-gray-100 text-gray-600" },
  "envoyé":  { label: "Envoyé",    classes: "bg-blue-50 text-blue-700" },
  "accepté": { label: "Accepté",   classes: "bg-emerald-50 text-emerald-700" },
  "refusé":  { label: "Refusé",    classes: "bg-red-50 text-red-600" },
};

function safeDateStr(d) {
  if (!d) return "";
  try {
    const date = typeof d.toDate === "function" ? d.toDate() : new Date(d);
    return isNaN(date) ? "" : date.toLocaleDateString("fr-FR");
  } catch {
    return "";
  }
}

export default function DevisList() {
  const { user, entrepriseId, entreprise } = useAuth();
  const navigate = useNavigate();
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [sentId, setSentId] = useState(null);

  useEffect(() => {
    if (!entrepriseId) return;
    const q = query(
      collection(db, "entreprises", entrepriseId, "devis"),
      orderBy("createdAt", "desc")
    );
    getDocs(q).then((snap) => {
      setDevis(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [entrepriseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce devis ?")) return;
    await deleteDoc(doc(db, "entreprises", entrepriseId, "devis", id));
    setDevis((prev) => prev.filter((d) => d.id !== id));
  };

  const handleConvert = async (devisItem) => {
    if (!window.confirm("Convertir ce devis en facture ?")) return;
    try {
      const facRef = doc(collection(db, "entreprises", entrepriseId, "factures"));
      const devisRef = doc(db, "entreprises", entrepriseId, "devis", devisItem.id);
      await createNumberedInvoice(entrepriseId, facRef, {
        clientId: devisItem.clientId,
        clientNom: devisItem.clientNom,
        clientEmail: devisItem.clientEmail,
        description: devisItem.description,
        amountHT: devisItem.amountHT,
        tva: devisItem.tva,
        totalTTC: devisItem.totalTTC,
        tvaRate: devisItem.tvaRate,
        mentionLegale: devisItem.mentionLegale || "",
        date: Timestamp.now(),
        status: "en attente",
        createdAt: Timestamp.now(),
        entrepriseId,
        sourceDevisId: devisItem.id,
      }, {
        withTransaction: (tx) => tx.update(devisRef, {
          convertedToFacture: true,
          factureId: facRef.id,
          status: "accepté",
        }),
      });
      setDevis((prev) =>
        prev.map((d) =>
          d.id === devisItem.id
            ? { ...d, convertedToFacture: true, factureId: facRef.id, status: "accepté" }
            : d
        )
      );
      navigate(`/dashboard/facture/modifier/${facRef.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la conversion.");
    }
  };

  async function loadDevisContext(devisItem) {
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
    if (devisItem.clientId) {
      const clientSnap = await getDoc(doc(db, "entreprises", entrepriseId, "clients", devisItem.clientId));
      if (clientSnap.exists()) clientData = clientSnap.data();
    }
    return {
      ...devisItem,
      clientNom: clientData.nom || devisItem.clientNom || "Client inconnu",
      clientAdresse: clientData.adresse || "",
      clientCodePostal: clientData.codePostal || "",
      clientVille: clientData.ville || "",
      clientEmail: clientData.email || devisItem.clientEmail || "",
      entrepriseNom: entreprise?.nom || "Nom Entreprise",
      entrepriseSiret: entreprise?.siret || "",
      entrepriseAdresse: entreprise?.adresse || "",
      entrepriseCodePostal: entreprise?.codePostal || "",
      entrepriseVille: entreprise?.ville || "",
      entrepriseTel: entreprise?.telephone || "",
      entrepriseEmail: entreprise?.emailContact || "",
      logoDataUrl,
    };
  }

  const handleGeneratePDF = async (devisItem) => {
    if (!entrepriseId) return;
    try {
      const ctx = await loadDevisContext(devisItem);
      await downloadDevisPDF(ctx);
    } catch (err) {
      console.error(err);
      alert("Erreur chargement des données pour le PDF.");
    }
  };

  const handleSendByEmail = async (devisItem) => {
    if (!entrepriseId) return;

    const ctx = await loadDevisContext(devisItem);
    const defaultEmail = ctx.clientEmail || "";
    const to = window.prompt("Envoyer le devis à l'adresse :", defaultEmail);
    if (!to) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      alert("Adresse email invalide.");
      return;
    }

    setSendingId(devisItem.id);
    try {
      const pdfBase64 = await getDevisPDFBase64(ctx);
      const numeroDevis = `DEV-${devisItem.id.slice(0, 8).toUpperCase()}`;
      const montant = `${Number(devisItem.totalTTC ?? 0).toFixed(2)} €`;
      const validite = safeDateStr(devisItem.dateValidite);

      await sendEmail(
        "devis_sent",
        to,
        {
          clientNom: ctx.clientNom,
          montant,
          numeroDevis,
          entrepriseNom: ctx.entrepriseNom,
          validite,
        },
        {
          attachments: [{ filename: `${numeroDevis}.pdf`, content: pdfBase64 }],
          replyTo: user?.email || undefined,
        }
      );

      const updates = {
        lastSentAt: serverTimestamp(),
        lastSentTo: to,
      };
      if (devisItem.status === "brouillon" || !devisItem.status) {
        updates.status = "envoyé";
      }
      await updateDoc(doc(db, "entreprises", entrepriseId, "devis", devisItem.id), updates);
      setDevis((prev) =>
        prev.map((d) =>
          d.id === devisItem.id
            ? { ...d, lastSentTo: to, status: updates.status || d.status }
            : d
        )
      );

      setSentId(devisItem.id);
      setTimeout(() => setSentId(null), 2500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de l'email : " + (err?.message || "inconnue"));
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Devis</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {devis.length} devis enregistré{devis.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {IA_IMPORT_ENABLED && (
            <Link
              to="/dashboard/import-documents"
              className="bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
            >
              ✨ Import IA
            </Link>
          )}
          <Link
            to="/dashboard/devis/import"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            Importer
          </Link>
          <Link
            to="/dashboard/devis/nouveau"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition"
          >
            + Nouveau devis
          </Link>
        </div>
      </div>

      {devis.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-500 font-medium">Aucun devis pour l'instant</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            Créez votre premier devis et convertissez-le en facture en un clic
          </p>
          <Link
            to="/dashboard/devis/nouveau"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
          >
            Créer un devis
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
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
              {devis.map((d) => {
                const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.brouillon;
                const sending = sendingId === d.id;
                const sent = sentId === d.id;
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[#0d1b3e]">{d.clientNom || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate hidden md:table-cell">
                      {d.description}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#0d1b3e]">
                      {d.totalTTC?.toFixed(2)} €
                    </td>
                    <td className="px-5 py-4 text-gray-400 hidden sm:table-cell">
                      {safeDateStr(d.date)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                      {d.convertedToFacture && (
                        <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                          Converti
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/dashboard/devis/modifier/${d.id}`)}
                          className="text-xs font-medium text-gray-500 hover:text-[#0d1b3e] transition"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(d)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleSendByEmail(d)}
                          disabled={sending}
                          title="Envoyer le devis par email avec PDF en pièce jointe"
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
                        {!d.convertedToFacture ? (
                          <button
                            onClick={() => handleConvert(d)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                          >
                            → Facture
                          </button>
                        ) : (
                          d.factureId && (
                            <button
                              onClick={() => navigate(`/dashboard/facture/modifier/${d.factureId}`)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
                            >
                              Voir facture
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleDelete(d.id)}
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
