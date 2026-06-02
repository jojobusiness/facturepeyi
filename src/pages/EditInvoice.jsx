import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import InvoiceLinesEditor from "../components/InvoiceLinesEditor";
import PdfLivePreview from "../components/PdfLivePreview";
import { computeTotals, normalizeLines } from "../utils/invoiceLines";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entreprise, entrepriseId } = useAuth();

  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ clientId: "", clientNom: "", status: "en attente", date: "", numero: "" });
  const [lignes, setLignes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultRate = entreprise?.tvaRate ?? 0;
  const mentionLegale = entreprise?.mentionLegale || "";

  useEffect(() => {
    if (!entrepriseId) return;
    getDocs(collection(db, "entreprises", entrepriseId, "clients"))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [entrepriseId]);

  useEffect(() => {
    if (!entrepriseId || !id) return;
    getDoc(doc(db, "entreprises", entrepriseId, "factures", id)).then((snap) => {
      if (!snap.exists()) { alert("Facture introuvable"); navigate("/dashboard/factures"); return; }
      const data = snap.data();
      const dateStr = data.date?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0];
      setForm({
        clientId: data.clientId || "",
        clientNom: data.clientNom || "",
        status: data.status || "en attente",
        date: dateStr,
        numero: data.numero || "",
      });
      // Rétro-compat : reconstruit des lignes éditables depuis l'ancien modèle mono-ligne
      setLignes(normalizeLines(data).map((l) => ({
        description: l.description,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tvaRate: l.tvaRate,
      })));
      setLoading(false);
    });
  }, [entrepriseId, id, navigate]);

  const handleClientChange = (e) => {
    const client = clients.find((c) => c.id === e.target.value);
    if (client) setForm({ ...form, clientId: client.id, clientNom: client.nom });
    else setForm({ ...form, clientId: "", clientNom: "" });
  };

  const selectedClient = clients.find((c) => c.id === form.clientId);

  const previewCtx = useMemo(() => ({
    numero: form.numero || "Aperçu",
    date: form.date,
    status: form.status,
    lignes: lignes || [],
    tvaRate: defaultRate,
    mentionLegale,
    clientNom: selectedClient?.nom || form.clientNom || "Client",
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
  }), [form, lignes, defaultRate, mentionLegale, selectedClient, entreprise]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entrepriseId) return;
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
      await updateDoc(doc(db, "entreprises", entrepriseId, "factures", id), {
        clientId: form.clientId,
        clientNom: form.clientNom,
        status: form.status,
        lignes: cleanLignes,
        description: cleanLignes.map((l) => l.description).filter(Boolean).join(" + ").slice(0, 200),
        amountHT: totalHT,
        tva: totalTVA,
        totalTTC,
        tvaRate: cleanLignes[0]?.tvaRate ?? defaultRate,
        date: Timestamp.fromDate(new Date(form.date)),
      });
      navigate("/dashboard/factures");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || lignes === null) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>;

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Modifier la facture</h2>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Client</label>
            <select value={form.clientId} onChange={handleClientChange} required className={inputClass}>
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Lignes de la facture</label>
            <InvoiceLinesEditor lignes={lignes} setLignes={setLignes} defaultRate={defaultRate} />
          </div>

          {mentionLegale && (
            <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 italic">{mentionLegale}</p>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Statut</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option value="en attente">En attente</option>
              <option value="payée">Payée</option>
              <option value="en retard">En retard</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Date de facture</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>

        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Aperçu en direct</p>
          <PdfLivePreview invoice={previewCtx} kind="facture" />
        </div>
      </div>
    </main>
  );
}
