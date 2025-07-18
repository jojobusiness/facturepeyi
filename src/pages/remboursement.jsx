import React from "react";

export default function Remboursement() {
  return (
    <main className="max-w-3xl mx-auto p-6 bg-white shadow rounded my-8">
      <h1 className="text-3xl font-bold mb-4">Politique de remboursement et de retour</h1>

      <p className="mb-4">
        Chez <strong>Factur’Peyi</strong>, la satisfaction de nos clients est au cœur de nos priorités. Nous vous invitons à lire attentivement notre politique de remboursement concernant votre abonnement.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Abonnement et période d’essai</h2>
      <p className="mb-4">
        Avant tout paiement, nous vous conseillons d’explorer notre période d’essai gratuite (si applicable) pour tester toutes les fonctionnalités du service.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Remboursements</h2>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>
          <strong>Abonnement mensuel :</strong> Toute souscription à un abonnement mensuel est considérée comme ferme et définitive. Aucune demande de remboursement ne sera acceptée une fois le paiement effectué, sauf cas exceptionnel de dysfonctionnement avéré du service. 
        </li>
        <li>
          <strong>Abonnement annuel :</strong> Les abonnements annuels peuvent faire l’objet d’un remboursement partiel dans un délai de 14 jours après l’achat, sur simple demande motivée et si le service n’a pas été utilisé de manière substantielle. Passé ce délai, aucun remboursement ne sera effectué.
        </li>
        <li>
          <strong>Période d’essai :</strong> Les utilisateurs profitant de la période d’essai gratuite ne sont débités qu’à la fin de cette période, sauf annulation préalable de leur abonnement.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Procédure de demande</h2>
      <p className="mb-4">
        Pour toute demande de remboursement, merci de nous contacter à l’adresse suivante : <a href="mailto:contact@facturpeyi.com" className="text-blue-600 underline">contact@facturpeyi.com</a> en précisant votre nom, prénom, email utilisé lors de l’inscription, ainsi que la raison de votre demande. Nous nous engageons à traiter votre demande sous 10 jours ouvrés.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Exceptions</h2>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>
          Aucun remboursement ne sera accordé si la demande est faite après la fin de la période de facturation ou en cas d’utilisation abusive du service.
        </li>
        <li>
          Les frais bancaires éventuels liés au remboursement restent à la charge du client.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">Contact</h2>
      <p>
        Pour toute question relative à cette politique ou à votre abonnement, n’hésitez pas à nous contacter : <a href="mailto:contact@facturpeyi.com" className="text-blue-600 underline">contact@facturpeyi.com</a>
      </p>
    </main>
  );
}