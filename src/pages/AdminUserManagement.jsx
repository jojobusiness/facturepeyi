import { useEffect, useState } from "react";
import {
  collection, getDocs, getDoc, doc, addDoc,
  updateDoc, deleteDoc, query, where,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { sendSignInLinkToEmail } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { checkUsersLimit } from "../lib/plans";
import PlanGate from "../components/PlanGate";

export default function AdminUserManagement() {
  const { entreprise } = useAuth();
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employe");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "utilisateurs", currentUser.uid));
      const entrepriseId = userDoc.data()?.entrepriseId;
      if (!entrepriseId) return;
      const q = query(collection(db, "utilisateurs"), where("entrepriseId", "==", entrepriseId));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!email) return alert("Veuillez entrer un email.");
    if (email === currentUser.email) return alert("Vous ne pouvez pas vous inviter vous-même.");
    const existing = await getDocs(query(collection(db, "utilisateurs"), where("email", "==", email)));
    if (!existing.empty) return alert("Cet utilisateur est déjà invité.");
    setSending(true);
    try {
      const currentUserDoc = await getDocs(query(collection(db, "utilisateurs"), where("email", "==", currentUser.email)));
      const entrepriseId = currentUserDoc.docs[0]?.data()?.entrepriseId;
      if (!entrepriseId) return alert("Impossible de récupérer l'entreprise liée.");
      const inviteUrl = `${window.location.origin}/invite-complete?email=${encodeURIComponent(email)}&entrepriseId=${entrepriseId}`;
      await sendSignInLinkToEmail(auth, email, { url: inviteUrl, handleCodeInApp: true });
      await addDoc(collection(db, "utilisateurs"), { email, role, entrepriseId, createdAt: new Date(), accepted: false });
      setEmail("");
      setRole("employe");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de l'invitation.");
    } finally {
      setSending(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateDoc(doc(db, "utilisateurs", userId), { role: newRole });
    fetchUsers();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    await deleteDoc(doc(db, "utilisateurs", userId));
    fetchUsers();
  };

  const ROLE_LABELS = { admin: "Admin", comptable: "Comptable", employe: "Employé" };

  const usersLimitCheck = checkUsersLimit(entreprise?.plan || "decouverte", users.length);

  return (
    <main>
      <h2 className="text-2xl font-bold text-[#0d1b3e] mb-6">Gestion de l'équipe</h2>

      {/* Inviter */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6 max-w-lg">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-4">Inviter un collaborateur</h3>
        {!usersLimitCheck.allowed ? (
          <PlanGate reason={usersLimitCheck.reason} upgradeRequired={usersLimitCheck.upgradeRequired} className="py-6" />
        ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              placeholder="collaborateur@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="comptable">Comptable</option>
              <option value="employe">Employé</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={sending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
          >
            {sending ? "Envoi en cours..." : "Envoyer l'invitation"}
          </button>
        </div>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.filter((u) => u.email !== currentUser.email).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-[#0d1b3e]">{user.email}</td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="comptable">Comptable</option>
                      <option value="employe">Employé</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-xs font-medium text-red-400 hover:text-red-600 transition"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {users.filter((u) => u.email !== currentUser.email).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Aucun collaborateur pour l'instant
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
