import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employe");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "entreprises"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!email) return alert("Veuillez entrer un email.");

    try {
      await addDoc(collection(db, "entreprises"), {
        email,
        role,
        nom: "",
        siret: "",
        notifications: true,
        theme: "clair",
        createdAt: new Date(),
      });
      alert("Utilisateur créé !");
      setEmail("");
      setRole("employe");
      fetchUsers();
    } catch (err) {
      console.error("Erreur ajout utilisateur :", err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const ref = doc(db, "entreprises", userId);
      await updateDoc(ref, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error("Erreur changement de rôle :", err);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await deleteDoc(doc(db, "entreprises", userId));
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
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="admin">Admin</option>
          <option value="comptable">Comptable</option>
          <option value="employe">Employé</option>
        </select>
        <button onClick={handleCreate} className="bg-[#1B5E20] text-white w-full p-2 rounded">Ajouter</button>
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
            <tr><td className="p-4">Chargement...</td></tr>
          ) : (
            users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="border p-1 rounded"
                  >
                    <option value="admin">Admin</option>
                    <option value="comptable">Comptable</option>
                    <option value="employe">Employé</option>
                  </select>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:underline"
                  >Supprimer</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}