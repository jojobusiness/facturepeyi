import React, { useState } from "react";

export default function Clients() {
  const [clients, setClients] = useState(["Client A", "Client B"]);
  const [newClient, setNewClient] = useState("");

  const addClient = () => {
    if (newClient.trim()) {
      setClients([...clients, newClient.trim()]);
      setNewClient("");
    }
  };

  return (
    <div>
      <h2>Vos clients</h2>
      <ul>
        {clients.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <input
        placeholder="Nouveau client"
        value={newClient}
        onChange={(e) => setNewClient(e.target.value)}
      />
      <button onClick={addClient}>Ajouter</button>
    </div>
  );
}
