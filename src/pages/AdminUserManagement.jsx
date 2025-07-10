import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { sendSignInLinkToEmail } from "firebase/auth";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employe");
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    const q = query(
      collection(db, "utilisateurs"),
      where("entrepriseId", "==", currentUser.uid)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setUsers(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!email) return alert("Veuillez entrer un email.");
    if (email === currentUser.email)
      return alert("Vous ne pouvez pas vous inviter vous-même.");
    if (!currentUser) return alert("Utilisateur non connecté");

    try {
      const inviteUrl = `${window.location.origin}/invite-complete?email=${encodeURIComponent(email)}&entrepriseId=${currentUser.uid}`;

      const actionCodeSettings = {
        url: inviteUrl,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      await addDoc(collection(db, "utilisateurs"), {
        email,
        role,
        entrepriseId: currentUser.uid,
        createdAt: new Date(),
        accepted: false,
      });

      alert(`Invitation envoyée à ${email} !`);
      setEmail("");
      setRole("employe");
      fetchUsers();
    } catch (err) {
      console.error("Erreur d'invitation :", err);
      alert("Erreur lors de l'envoi de l'invitation.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "utilisateurs", userId), { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error("Erreur changement de rôle :", err);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await deleteDoc(doc(db, "utilisateurs", userId));
    fetchUsers();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">👥 Gestion des utilisateurs</h2>

      <div className="bg-white p-4 rounded shadow max-w-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Ajouter un utilisateur</h3>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="comptable">Comptable</option>
          <option value="employe">Employé</option>
        </select>
        <button
          onClick={handleCreate}
          className="bg-[#1B5E20] text-white w-full p-2 rounded"
        >
          Inviter
        </button>
      </div>

      <table className="w-full bg-white shadow rounded">
        <thead className="bg-[#1B5E20] text-white">
          <tr>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Rôle</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="p-4">Chargement...</td>
            </tr>
          ) : (
            users
              .filter((user) => user.email !== currentUser.email) // ⛔ Ne pas inclure soi-même
              .map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="comptable">Comptable</option>
                      <option value="employe">Employé</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </main>
  );
}