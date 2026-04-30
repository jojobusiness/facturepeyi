import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TERRITORIES } from "../lib/territories";
import { FaBuilding, FaPlus, FaArrowRight, FaMapMarkerAlt, FaFileInvoice } from "react-icons/fa";

export default function Cabinet() {
  const { entreprise, managedEntreprises, isCabinet, switchEntreprise, refreshManagedEntreprises } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshManagedEntreprises();
  }, []);

  const handleSwitch = async (id) => {
    await switchEntreprise(id);
    navigate("/dashboard");
  };

  if (!isCabinet) {
    return (
      <main className="max-w-lg mx-auto py-16 text-center">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8">
          <FaBuilding className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0d1b3e] mb-2">Plan Cabinet requis</h2>
          <p className="text-sm text-gray-500 mb-5">
            Le mode Cabinet permet de gérer plusieurs entreprises depuis un seul compte.
          </p>
          <Link to="/Forfaits" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition">
            Voir les forfaits
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Mon Cabinet</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {managedEntreprises.length} client{managedEntreprises.length !== 1 ? "s" : ""} géré{managedEntreprises.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/dashboard/cabinet/ajouter"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2"
        >
          <FaPlus className="w-3 h-3" /> Ajouter un client
        </Link>
      </div>

      {managedEntreprises.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          <FaBuilding className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-1">Aucun client pour l'instant</p>
          <p className="text-gray-400 text-sm mb-6">
            Ajoutez votre premier client pour gérer sa comptabilité depuis votre cabinet.
          </p>
          <Link
            to="/dashboard/cabinet/ajouter"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
          >
            + Ajouter un client
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {managedEntreprises.map((e) => {
            const territoire = TERRITORIES[e.territoire];
            const isActive = entreprise?.id === e.id;
            return (
              <div
                key={e.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                  isActive ? "border-emerald-500 ring-2 ring-emerald-100" : "border-gray-100 hover:border-gray-200"
                }`}
                onClick={() => handleSwitch(e.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl flex-shrink-0">
                    {territoire?.flag || "🏢"}
                  </div>
                  {isActive && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Actif
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-[#0d1b3e] text-sm mb-1 truncate">{e.nom || "Sans nom"}</h3>

                <div className="space-y-1.5 mb-4">
                  {territoire && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FaMapMarkerAlt className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      {territoire.label}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FaFileInvoice className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    TVA {e.tvaRate ?? 0}%
                    {e.octroiDeMer && <span className="ml-1 bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-xs">Octroi de mer</span>}
                  </div>
                </div>

                <button
                  onClick={(ev) => { ev.stopPropagation(); handleSwitch(e.id); }}
                  className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-xl transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 cursor-default"
                      : "bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700"
                  }`}
                >
                  {isActive ? "En cours de consultation" : <>Gérer ce client <FaArrowRight className="w-2.5 h-2.5" /></>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
