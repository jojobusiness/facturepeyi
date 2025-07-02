import React from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  return (
    <div>
      <h2>Paramètres</h2>
      <p>Ici vous pourrez modifier vos préférences (à développer plus tard).</p>
    </div>
  );
}

export default function BoutonRetourDashboard() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/dashboard")}
      className="mb-4 px-4 py-2 bg-[#1B5E20] text-white rounded hover:bg-green-800"
    >
      ← Retour au tableau de bord
    </button>
  );
}

