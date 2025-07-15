import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData(e.target);
    const url = "https://formspree.io/f/xanbywyy"; // <-- remplace par ton endpoint !

    try {
      const res = await fetch(url, {
        method: "POST",
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        setSent(true);
        setError(null);
        e.target.reset();
        setTimeout(() => setSent(false), 5000);
      } else {
        setError("Erreur lors de l'envoi du message.");
      }
    } catch {
      setError("Erreur lors de l'envoi du message.");
    }
  };

  return (
    <section className="max-w-lg mx-auto bg-white p-8 rounded shadow my-16">
      <h2 className="text-2xl font-bold mb-4 text-center">📩 Contactez-nous</h2>
      <p className="text-center mb-10 text-gray-600">
        Une question, une suggestion ? Écrivez-nous, nous vous répondrons rapidement.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <input name="nom" required placeholder="Nom" className="flex-1 border p-2 rounded" />
          <input name="prenom" required placeholder="Prénom" className="flex-1 border p-2 rounded" />
        </div>
        <input name="email" type="email" required placeholder="Adresse e-mail" className="w-full border p-2 rounded" />
        <textarea name="message" required placeholder="Votre message..." className="w-full border p-2 rounded" rows={4} />
        <button type="submit" className="bg-[#1B5E20] text-white w-full py-2 rounded hover:bg-green-800">
          Envoyer le message
        </button>
      </form>
      {sent && (
        <div className="mt-6 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-center transition">
          Merci, nous avons bien reçu votre message !
        </div>
      )}
      {error && (
        <div className="mt-6 p-3 bg-red-100 border border-red-300 text-red-800 rounded text-center transition">
          {error}
        </div>
      )}
    </section>
  );
}

