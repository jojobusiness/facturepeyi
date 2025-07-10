import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get("clientId");

  const [form, setForm] = useState({
    clientId: prefilledClientId || "",
    clientNom: "",
    description: "",
    status: "en attente",
  });

  const [clients, setClients] = useState([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [montantHT, setMontantHT] = useState(0);
  const [tauxTVA, setTauxTVA] = useState(0);
  const [montantTVA, setMontantTVA] = useState(0);
  const [montantTTC, setMontantTTC] = useState(0);
  const [entrepriseId, setEntrepriseId] = useState(null);

  useEffect(() => {
    const ht = parseFloat(montantHT);
    const taux = parseFloat(tauxTVA);
    const tva = (ht * taux) / 100;
    setMontantTVA(tva);
    setMontantTTC(ht + tva);
  }, [montantHT, tauxTVA]);

  useEffect(() => {
    const fetchEntrepriseAndData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // ✅ Récupérer l'entrepriseId de l'utilisateur connecté
        const userSnap = await getDoc(doc(db, "utilisateurs", uid));
        const userData = userSnap.data();
        const entId = userData?.entrepriseId;
        if (!entId) throw new Error("Entreprise introuvable");

        setEntrepriseId(entId);

        // ✅ Récupérer les clients liés à l'entreprise
        const clientSnap = await getDocs(
          collection(db, "entreprises", entId, "clients")
        );
        const clientList = clientSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientList);

        // ✅ Charger la facture
        const factureRef = doc(db, "entreprises", entId, "factures", id);
        const snap = await getDoc(factureRef);

        if (snap.exists()) {
          const data = snap.data();
          setForm({
            clientId: data.clientId || "",
            clientNom: data.clientNom || "",
            description: data.description || "",
            status: data.status || "en attente",
          });
          setMontantHT(data.amountHT || 0);
          setTauxTVA(data.tvaRate || data.tva || 0);
        } else {
          alert("Facture introuvable");
          navigate("/factures");
        }

        // ✅ Récupérer logo entreprise (optionnel)
        const entSnap = await getDoc(doc(db, "entreprises", entId));
        if (entSnap.exists()) {
          setLogoUrl(entSnap.data().logoUrl || "");
        }
      } catch (err) {
        console.error(err);
        alert("Erreur chargement données");
      }
    };

    fetchEntrepriseAndData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClientChange = (e) => {
    const client = clients.find((c) => c.id === e.target.value);
    setForm({ ...form, clientId: client.id, clientNom: client.nom });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid || !entrepriseId) return alert("Utilisateur non connecté");

    try {
      await updateDoc(
        doc(db, "entreprises", entrepriseId, "factures", id),
        {
          clientId: form.clientId,
          clientNom: form.clientNom,
          description: form.description,
          status: form.status,
          amountHT: parseFloat(montantHT),
          tvaRate: parseFloat(tauxTVA),
          tva: parseFloat(montantTVA),
          totalTTC: parseFloat(montantTTC),
          date: Timestamp.fromDate(new Date()),
          uid, // toujours garder pour sécurité
        }
      );

      alert("✅ Facture modifiée !");
      navigate("/factures");
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de la modification.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Modifier la facture</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow space-y-4 max-w-md"
      >
        <select
          value={form.clientId}
          onChange={handleClientChange}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">-- Sélectionner un client --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 border rounded"
          required
        />

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="en attente">En attente</option>
          <option value="payée">Payée</option>
          <option value="annulée">Annulée</option>
        </select>

        <div>
          <label className="block font-medium mb-1">Montant HT (€)</label>
          <input
            type="number"
            value={montantHT}
            onChange={(e) => setMontantHT(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">TVA (%)</label>
          <select
            value={tauxTVA}
            onChange={(e) => setTauxTVA(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value={0}>0%</option>
            <option value={2.1}>2.1%</option>
            <option value={5.5}>5.5%</option>
            <option value={8.5}>8.5%</option>
            <option value={10}>10%</option>
            <option value={20}>20%</option>
          </select>
        </div>

        <p className="text-sm">
          TVA : <strong>{montantTVA.toFixed(2)} €</strong>
        </p>
        <p className="text-sm">
          Total TTC : <strong>{montantTTC.toFixed(2)} €</strong>
        </p>

        <button
          type="submit"
          className="bg-[#1B5E20] text-white w-full p-2 rounded"
        >
          💾 Enregistrer
        </button>
      </form>
    </main>
  );
}