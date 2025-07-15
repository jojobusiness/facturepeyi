import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const questions = [
  {
    question: "Est-ce que Factur’Peyi est adapté aux entreprises en Guyane ?",
    answer: "Oui, c’est notre mission. L’outil est conçu pour les indépendants, artisans et PME de Guyane 🇬🇫 avec gestion complète de la TVA DOM.",
  },
  {
    question: "Puis-je ajouter des employés ou comptables ?",
    answer: "Oui. Chaque entreprise peut inviter ses collaborateurs avec un rôle : admin, comptable ou employé.",
  },
  {
    question: "Comment gérer mes dépenses et ma comptabilité ?",
    answer: "Vous pouvez enregistrer vos dépenses, les catégoriser, et consulter automatiquement vos bilans comptables.",
  },
  {
    question: "Puis-je générer mes déclarations fiscales ?",
    answer: "Oui. Une section dédiée vous permet d’exporter les données nécessaires à votre comptable au format PDF.",
  },
  {
    question: "Dois-je installer une application ?",
    answer: "Non. Factur’Peyi fonctionne entièrement en ligne, depuis votre téléphone, tablette ou ordinateur.",
  },
  {
    question: "Est-ce sécurisé ?",
    answer: "Oui. Vos données sont stockées de manière sécurisée.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gray-50 py-16 px-4">
      <h2 className="text-2xl font-bold text-center mb-10">❓ Questions Fréquentes</h2>
      <div className="max-w-4xl mx-auto space-y-4">
        {questions.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded shadow p-4 cursor-pointer"
            onClick={() => toggle(index)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{item.question}</h3>
              {openIndex === index ? (
                <FaChevronUp className="text-gray-600" />
              ) : (
                <FaChevronDown className="text-gray-600" />
              )}
            </div>
            {openIndex === index && (
              <p className="text-gray-700 mt-3">{item.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}