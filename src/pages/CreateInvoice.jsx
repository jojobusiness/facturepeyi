import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { collection, doc, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkFacturesLimit } from "../lib/plans";
import PlanGate from "../components/PlanGate";
import InvoiceLinesEditor from "../components/InvoiceLinesEditor";
import PdfLivePreview from "../components/PdfLivePreview";
import { computeTotals, normalizeLines, emptyLine } from "../utils/invoiceLines";
import { createNumberedInvoice } from "../utils/invoiceNumber";
import { track, EVENTS } from "../lib/analytics";

export default function CreateInvoice() {
  const { entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();
  const [planBlock, setPlanBlock] = useState(null);

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [lignes, setLignes] = useState(null); // null tant que la TVA par défaut n'est pas connue
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const defaultRate = entreprise?.tvaRate ?? 0;
  const mentionLegale = entreprise?.mentionLegale || "";

  // Initialise une première ligne dès que la config TVA de l'entreprise est chargée
  useEffect(() => {
    if (entreprise && lignes === null) setLignes([emptyLine(entreprise.tvaRate ?? 0)]);
  }, [entreprise, lignes]);

  // Vérifier limite factures selon plan
  useEffect(() => {
    if (!entrepriseId || !entreprise) return;
    getDocs(collection(db, "entreprises", entrepriseId, "factures")).then((snap) => {
      const check = checkFacturesLimit(entreprise.plan || "decouverte", snap.size);
      if (!check.allowed) setPlanBlock(check);
    });
  }, [entrepriseId, entreprise]);

  // Charger les clients
  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error("Erreur chargement clients :", err));
  }, [entrepriseId]);

  const selectedClient = clients.find((c) => c.id === clientId);

  // Contexte pour l'aperçu PDF live
  const previewCtx = useMemo(() => ({
    numero: "Aperçu",
    date,
    status: "en attente",
    lignes: lignes || [],
    tvaRate: defaultRate,
    mentionLegale,
    clientNom: selectedClient?.nom || "Client",
    clientAdresse: selectedClient?.adresse || "",
    clientCodePostal: selectedClient?.codePostal || "",
    clientVille: selectedClient?.ville || "",
    clientEmail: selectedClient?.email || "",
    entrepriseNom: entreprise?.nom || "Mon entreprise",
    entrepriseSiret: entreprise?.siret || "",
    entrepriseAdresse: entreprise?.adresse || "",
    entrepriseCodePostal: entreprise?.codePostal || "",
    entrepriseVille: entreprise?.ville || "",
    entrepriseTel: entreprise?.telephone || "",
    entrepriseEmail: entreprise?.emailContact || "",
    entrepriseTva: entreprise?.numeroTVA || "",
    entrepriseFormeJuridique: entreprise?.formeJuridique || "",
    entrepriseCapital: entreprise?.capital || "",
    entrepriseRcs: entreprise?.rcs || "",
    entrepriseIban: entreprise?.iban || "",
    entrepriseBic: entreprise?.bic || "",
  }), [date, lignes, defaultRate, mentionLegale, selectedClient, entreprise]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return alert("Veuillez sélectionner un client.");
    if (!entrepriseId) return alert("Entreprise introuvable.");
    const cleanLignes = (lignes || [])
      .filter((l) => l.description?.trim() || Number(l.prixUnitaire) > 0)
      .map((l) => ({
        description: l.description || "",
        quantite: Number(l.quantite) || 0,
        prixUnitaire: Number(l.prixUnitaire) || 0,
        tvaRate: Number(l.tvaRate) || 0,
      }));
    if (cleanLignes.length === 0) return alert("Ajoutez au moins une ligne avec un montant.");

    setSaving(true);
    try {
      const norm = normalizeLines({ lignes: cleanLignes, tvaRate: defaultRate });
      const { totalHT, totalTVA, totalTTC } = computeTotals(norm);

      const facRef = doc(collection(db, "entreprises", entrepriseId, "factures"));
      await createNumberedInvoice(entrepriseId, facRef, {
        clientId,
        clientNom: selectedClient?.nom || "",
        clientEmail: selectedClient?.email || "",
        lignes: cleanLignes,
        description: cleanLignes.map((l) => l.description).filter(Boolean).join(" + ").slice(0, 200),
        amountHT: totalHT,
        tva: totalTVA,
        totalTTC,
        tvaRate: cleanLignes[0]?.tvaRate ?? defaultRate,
        mentionLegale,
        date: Timestamp.fromDate(new Date(date)),
        status: "en attente",
        createdAt: Timestamp.now(),
        entrepriseId,
      });

      track(EVENTS.INVOICE_CREATED, { totalTTC, nbLignes: cleanLignes.length });

      navigate("/dashboard/factures");
    } catch (err) {
      console.error("Erreur Firestore :", err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (lignes === null) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chargement de la configuration fiscale...
      </div>
    );
  }

  if (planBlock) {
    return (
      <main className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Créer une facture</h2>
        <PlanGate reason={planBlock.reason} upgradeRequired={planBlock.upgradeRequired} />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Créer une facture</h2>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Lignes de la facture</label>
              {entreprise?.territoire && (
                <span className="text-xs text-gray-400">TVA pré-remplie : {defaultRate}%</span>
              )}
            </div>
            <InvoiceLinesEditor lignes={lignes} setLignes={setLignes} defaultRate={defaultRate} />
          </div>

          {mentionLegale && (
            <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 italic">{mentionLegale}</p>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Date de facture</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer la facture"}
          </button>
        </form>

        {/* Aperçu live */}
        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Aperçu en direct</p>
          <PdfLivePreview invoice={previewCtx} kind="facture" />
        </div>
      </div>
    </main>
  );
}
