import { useState } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Login from './pages/Login';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

export default function Home() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !contact) return;
    try {
      await addDoc(collection(db, 'inscriptions'), { name, contact, createdAt: new Date() });
      alert('Inscription envoyée !');
      setName(''); setContact('');
    } catch (err) {
      alert("Erreur lors de l'inscription.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] flex flex-col items-center p-4 space-y-10">
      <div className="bg-[#1B5E20] text-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-2">Factur’Peyi</h1>
        <p className="text-yellow-400 text-lg mb-6">la compta simple et locale</p>
        <Login />
      </div>
      <section className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Pré-inscription</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" className="w-full p-2 rounded border" />
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email ou téléphone" className="w-full p-2 rounded border" />
          <button type="submit" className="bg-[#1B5E20] hover:bg-[#2e7d32] text-white p-2 w-full rounded">S’inscrire</button>
        </form>
      </section>

      <section className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">À propos</h2>
        <p className="text-gray-700 text-sm">
          Factur’Peyi est une solution pensée pour les artisans, commerçants et indépendants de la Guyane française. Simple, rapide et conforme à la TVA DOM, notre outil permet de gérer vos factures sans prise de tête, depuis votre téléphone.
        </p>
      </section>
    </main>
  );
}