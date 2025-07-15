import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // adapte le chemin

export default function ContactForm() {
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setSent(false);
    try {
      // Enregistre le message dans Firestore (collection "messages_contact")
      await addDoc(collection(db, "messages_contact"), {
        ...form,
        createdAt: new Date()
      });
      setForm({ nom: "", prenom: "", email: "", message: "" });
      setSent(true);
    } catch (err) {
      alert("Erreur lors de l'envoi du message.");
    }
    setLoading(false);
  };

  return (
    <section className="max-w-lg mx-auto bg-white p-8 rounded shadow my-16">
      <h2 className="text-2xl font-bold mb-4 text-center">Contact</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex space-x-2">
          <input
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
            placeholder="Nom"
            className="flex-1 border p-2 rounded"
          />
          <input
            name="prenom"
            value={form.prenom}
            onChange={handleChange}
            required
            placeholder="Prénom"
            className="flex-1 border p-2 rounded"
          />
        </div>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="Adresse e-mail"
          className="w-full border p-2 rounded"
        />
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          placeholder="Votre message..."
          className="w-full border p-2 rounded"
          rows={4}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1B5E20] text-white w-full py-2 rounded hover:bg-green-800"
        >
          {loading ? "Envoi en cours..." : "Envoyer le message"}
        </button>
      </form>
      {/* ✅ Notification de succès */}
      {sent && (
        <div className="mt-6 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-center transition">
          Merci, nous avons bien reçu votre message !
        </div>
      )}
    </section>
  );
}