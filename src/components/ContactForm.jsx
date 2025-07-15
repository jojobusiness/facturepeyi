import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Laisse le submit faire, puis affiche la notif
    setSent(true);
    setTimeout(() => setSent(false), 5000); // Disparait au bout de 5s
    e.target.reset(); // Vide les champs
  };

  return (
    <section className="max-w-lg mx-auto bg-white p-8 rounded shadow my-16">
      <h2 className="text-2xl font-bold mb-4 text-center">Contact</h2>
      <form
        action="https://formspree.io/f/xanbywyy"
        method="POST"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Anti spam */}
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_autoresponse" value="Merci, nous avons bien reçu votre message !" />
        <input type="hidden" name="_template" value="box" />

        <div className="flex space-x-2">
          <input name="nom" required placeholder="Nom" className="flex-1 border p-2 rounded" />
          <input name="prenom" required placeholder="Prénom" className="flex-1 border p-2 rounded" />
        </div>
        <input
          name="email"
          type="email"
          required
          placeholder="Adresse e-mail"
          className="w-full border p-2 rounded"
        />
        <textarea
          name="message"
          required
          placeholder="Votre message..."
          className="w-full border p-2 rounded"
          rows={4}
        />
        <button
          type="submit"
          className="bg-[#1B5E20] text-white w-full py-2 rounded hover:bg-green-800"
        >
          Envoyer le message
        </button>
      </form>
      {sent && (
        <div className="mt-6 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-center transition">
          Merci, nous avons bien reçu votre message !
        </div>
      )}
    </section>
  );
}
