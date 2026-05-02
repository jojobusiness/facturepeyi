import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc,
  updateDoc, deleteDoc, doc, query, where, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { sendSignInLinkToEmail } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { checkUsersLimit, getPlan } from "../lib/plans";
import PlanGate from "../components/PlanGate";
import {
  FaUserPlus, FaTrash, FaEnvelope, FaUserShield,
  FaUserTie, FaUser, FaClock, FaCheckCircle, FaUsers,
} from "react-icons/fa";

const ROLE_CONFIG = {
  admin:      { label: "Admin",      color: "bg-purple-50 text-purple-700 border border-purple-200" },
  comptable:  { label: "Comptable",  color: "bg-blue-50 text-blue-700 border border-blue-200" },
  employe:    { label: "Employé",    color: "bg-gray-100 text-gray-600 border border-gray-200" },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.employe;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function Avatar({ email, accepted }) {
  const letter = email?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="relative flex-shrink-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
        accepted ? "bg-emerald-600" : "bg-gray-300"
      }`}>
        {letter}
      </div>
      {!accepted && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white" />
      )}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <FaTrash className="text-red-500 w-4 h-4" />
        </div>
        <h3 className="font-bold text-[#0d1b3e] text-base mb-1">Confirmer la suppression</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  const colors = {
    success: "bg-emerald-600",
    error:   "bg-red-600",
    info:    "bg-[#0d1b3e]",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${colors[type] || colors.info}`}>
      {message}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: i === 1 ? "60%" : i === 2 ? "80%" : i === 3 ? "50%" : "30%" }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminUserManagement() {
  const { entreprise, entrepriseId } = useAuth();
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employe");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (entrepriseId) fetchUsers();
  }, [entrepriseId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "utilisateurs"), where("entrepriseId", "==", entrepriseId));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      showToast("Erreur lors du chargement de l'équipe.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "info") => setToast({ message, type });

  const handleCreate = async () => {
    if (!email.trim()) return showToast("Veuillez entrer un email.", "error");
    if (email === currentUser?.email) return showToast("Vous ne pouvez pas vous inviter vous-même.", "error");

    const existing = await getDocs(query(collection(db, "utilisateurs"), where("email", "==", email)));
    if (!existing.empty) return showToast("Cet utilisateur est déjà invité.", "error");

    setSending(true);
    try {
      const inviteUrl = `${window.location.origin}/invite-complete?email=${encodeURIComponent(email)}&entrepriseId=${entrepriseId}`;
      await sendSignInLinkToEmail(auth, email, { url: inviteUrl, handleCodeInApp: true });
      await addDoc(collection(db, "utilisateurs"), {
        email,
        role,
        entrepriseId,
        createdAt: serverTimestamp(),
        accepted: false,
      });
      setEmail("");
      setRole("employe");
      fetchUsers();
      showToast("Invitation envoyée avec succès.", "success");
    } catch {
      showToast("Erreur lors de l'envoi de l'invitation.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "utilisateurs", userId), { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      showToast("Rôle mis à jour.", "success");
    } catch {
      showToast("Erreur lors de la mise à jour du rôle.", "error");
    }
  };

  const handleDelete = (user) => {
    setConfirmDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "utilisateurs", confirmDelete.id));
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
      showToast("Collaborateur supprimé.", "success");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const otherUsers = users.filter((u) => u.email !== currentUser?.email);
  const currentUserData = users.find((u) => u.email === currentUser?.email);
  const usersLimitCheck = checkUsersLimit(entreprise?.plan || "decouverte", users.length);
  const maxUsers = getPlan(entreprise?.plan || "decouverte").maxUsers;

  const pendingCount = otherUsers.filter((u) => !u.accepted).length;
  const activeCount  = otherUsers.filter((u) => u.accepted).length;

  return (
    <main>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d1b3e]">Gestion de l'équipe</h2>
          <p className="text-sm text-gray-500 mt-0.5">Invitez des collaborateurs et gérez leurs accès.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-center">
            <div className="text-lg font-extrabold text-emerald-600">{activeCount}</div>
            <div className="text-xs text-gray-400">Actif{activeCount > 1 ? "s" : ""}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-center">
            <div className="text-lg font-extrabold text-amber-500">{pendingCount}</div>
            <div className="text-xs text-gray-400">En attente</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire d'invitation */}
        <div className="lg:col-span-1">
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sticky top-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FaUserPlus className="text-emerald-600 w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-[#0d1b3e]">Inviter un collaborateur</h3>
            </div>

            {!usersLimitCheck.allowed ? (
              <PlanGate reason={usersLimitCheck.reason} upgradeRequired={usersLimitCheck.upgradeRequired} className="py-4" />
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                    Adresse email
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
                    <input
                      type="email"
                      placeholder="collaborateur@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Rôle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition bg-white"
                  >
                    <option value="comptable">Comptable — accès comptabilité</option>
                    <option value="employe">Employé — accès limité</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                  <p className="font-semibold text-gray-600 mb-1">Différence des rôles :</p>
                  <p><span className="text-blue-600 font-medium">Comptable</span> — voit la comptabilité, rapports et déclarations TVA.</p>
                  <p className="mt-0.5"><span className="text-gray-600 font-medium">Employé</span> — crée des factures et devis uniquement.</p>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={sending || !email.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="w-3.5 h-3.5" />
                      Envoyer l'invitation
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Liste des membres */}
        <div className="lg:col-span-2 space-y-4">
          {/* Vous (admin actuel) */}
          {currentUserData && (
            <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vous</span>
              </div>
              <div className="px-5 py-4 flex items-center gap-4">
                <Avatar email={currentUserData.email} accepted={true} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0d1b3e] truncate">{currentUserData.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FaCheckCircle className="text-emerald-500 w-3 h-3" />
                    <span className="text-xs text-gray-400">Compte actif</span>
                  </div>
                </div>
                <RoleBadge role={currentUserData.role || "admin"} />
              </div>
            </section>
          )}

          {/* Collaborateurs */}
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Collaborateurs ({otherUsers.length})
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaUsers className="w-3 h-3" />
                {users.length} / {maxUsers === Infinity ? "∞" : maxUsers} membres
              </div>
            </div>

            {loading ? (
              <table className="w-full text-sm">
                <tbody>{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</tbody>
              </table>
            ) : otherUsers.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <FaUsers className="text-gray-300 w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">Aucun collaborateur pour l'instant</p>
                <p className="text-xs text-gray-400 mt-1">Utilisez le formulaire à gauche pour inviter votre équipe.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Collaborateur</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Statut</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rôle</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {otherUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar email={u.email} accepted={u.accepted} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[#0d1b3e] truncate max-w-[160px]">{u.email}</div>
                            {u.nom && <div className="text-xs text-gray-400 truncate">{u.nom}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {u.accepted ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <FaCheckCircle className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
                            <FaClock className="w-3 h-3" /> En attente
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={u.role || "employe"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white transition"
                        >
                          <option value="comptable">Comptable</option>
                          <option value="employe">Employé</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(u)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center ml-auto transition group"
                          title="Supprimer"
                        >
                          <FaTrash className="w-3 h-3 text-red-400 group-hover:text-red-600 transition" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>

      {/* Modal de confirmation */}
      {confirmDelete && (
        <ConfirmModal
          message={`Supprimer ${confirmDelete.email} de l'équipe ? Cette action est irréversible.`}
          onConfirm={confirmDeleteUser}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}
