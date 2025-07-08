import { auth, db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { sendSignInLinkToEmail } from "firebase/auth";

const actionCodeSettings = {
  url: `${window.location.origin}/invite-complete`,
  handleCodeInApp: true,
};

export const inviteUser = async ({ email, role, entrepriseId }) => {
  try {
    // Enregistrement dans la collection "utilisateurs"
    await addDoc(collection(db, "utilisateurs"), {
      email,
      role,
      entrepriseId,
      status: "invited",
      createdAt: Timestamp.now(),
    });

    // Envoi du lien magique
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", email);
    alert("Lien d'inscription envoyé à " + email);
  } catch (err) {
    console.error("Erreur d'invitation:", err);
    alert("Erreur lors de l'invitation. Voir console.");
  }
};
