import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InvoiceLinesEditor from "../components/InvoiceLinesEditor";
import PdfLivePreview from "../components/PdfLivePreview";
import { computeTotals, normalizeLines, emptyLine } from "../utils/invoiceLines";

export default function CreateDevis() {
  const { entreprise, entrepriseId } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [lignes, setLignes] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [validiteJours, setValiditeJours] = useState(30);
  const [saving, setSaving] = useState(false);

  const defaultRate = entreprise?.tvaRate ?? 0;
  const mentionLegale = entreprise?.mentionLegale || "";

  useEffect(() => {
    if (entreprise && lignes === null) setLignes([emptyLine(entreprise.tvaRate ?? 0)]);
  }, [entreprise, lignes]);

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((err) => console.error("Erreur chargement clients :", err));
  }, [entrepriseId]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const dateValidite = useMemo(() => {
    const d = new Date(date);
    d.setDate(d.getDate() + parseInt(validiteJours));
    return d;
  }, [date, validiteJours]);

  const previewCtx = useMemo(() => ({
    numero: "Aperçu",
    date,
    dateValidite,
    status: "brouillon",
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
  }), [date, dateValidite, lignes, defaultRate, mentionLegale, selectedClient, entreprise]);

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
      const { totalHT, totalTVA, totalTTC } = computeTotals(normalizeLines({ lignes: cleanLignes, tvaRate: defaultRate }));
      const dateObj = new Date(date);
      const dateExpiration = new Date(dateObj);
      dateExpiration.setDate(dateExpiration.getDate() + parseInt(validiteJours));

      await addDoc(collection(db, "entreprises", entrepriseId, "devis"), {
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
        date: Timestamp.fromDate(dateObj),
        dateExpiration: Timestamp.fromDate(dateExpiration),
        dateValidite: Timestamp.fromDate(dateExpiration),
        validiteJours: parseInt(validiteJours),
        status: "brouillon",
        convertedToFacture: false,
        createdAt: Timestamp.now(),
        entrepriseId,
      });

      navigate("/dashboard/devis");
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

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Créer un devis</h2>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className={inputClass}>
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Lignes du devis</label>
            <InvoiceLinesEditor lignes={lignes} setLignes={setLignes} defaultRate={defaultRate} />
          </div>

          {mentionLegale && (
            <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 italic">{mentionLegale}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Date du devis</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Validité</label>
              <select value={validiteJours} onChange={(e) => setValiditeJours(e.target.value)} className={inputClass}>
                <option value={15}>15 jours</option>
                <option value={30}>30 jours</option>
                <option value={45}>45 jours</option>
                <option value={60}>60 jours</option>
                <option value={90}>90 jours</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
            {saving ? "Enregistrement..." : "Enregistrer le devis"}
          </button>
        </form>

        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Aperçu en direct</p>
          <PdfLivePreview invoice={previewCtx} kind="devis" />
        </div>
      </div>
    </main>
  );
}
