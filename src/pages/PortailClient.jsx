import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

export default function PortailClient() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get("paid") === "true";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch(`/api/portail-data?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de chargement");
        setLoading(false);
      });
  }, [token]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const r = await fetch("/api/create-invoice-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (d.error === "already_paid") {
        window.location.reload();
        return;
      }
      if (d.url) {
        window.location.href = d.url;
      } else {
        setPaying(false);
      }
    } catch {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <p className="font-semibold text-[#0d1b3e] text-lg">Lien invalide ou expiré</p>
          <p className="text-sm text-gray-400 mt-2">Ce lien de paiement n'est plus disponible.</p>
        </div>
      </div>
    );
  }

  const { facture, entreprise, client } = data;
  const isPaid = facture.status === "payée" || justPaid;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header entreprise */}
        <div className="text-center mb-8">
          {entreprise.logo && (
            <img
              src={entreprise.logo}
              alt={entreprise.nom}
              className="h-12 mx-auto mb-3 object-contain"
            />
          )}
          <p className="font-semibold text-[#0d1b3e]">{entreprise.nom}</p>
          {entreprise.siret && (
            <p className="text-xs text-gray-400 mt-0.5">SIRET {entreprise.siret}</p>
          )}
        </div>

        {/* Carte facture */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Bandeau statut */}
          <div className={`px-6 py-4 flex items-center justify-between ${isPaid ? "bg-emerald-50 border-b border-emerald-100" : "bg-amber-50 border-b border-amber-100"}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                {isPaid ? "✓ Facture payée" : "En attente de paiement"}
              </span>
            </div>
            <span className="text-2xl font-bold text-[#0d1b3e]">
              {facture.totalTTC?.toFixed(2)} €
            </span>
          </div>

          <div className="p-6 space-y-6">

            {/* Émetteur / Destinataire */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">De</p>
                <p className="font-medium text-[#0d1b3e]">{entreprise.nom}</p>
                {entreprise.adresse && (
                  <p className="text-gray-400 text-xs mt-0.5">{entreprise.adresse}</p>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">À</p>
                <p className="font-medium text-[#0d1b3e]">{client.nom}</p>
                {client.email && (
                  <p className="text-gray-500 text-xs mt-0.5">{client.email}</p>
                )}
                {client.adresse && (
                  <p className="text-gray-400 text-xs mt-0.5">{client.adresse}</p>
                )}
              </div>
            </div>

            {/* Date */}
            {facture.date && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Date :</span>
                <span className="text-[#0d1b3e] font-medium">
                  {new Date(facture.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Description */}
            {facture.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">Prestation</p>
                <p className="text-sm text-[#0d1b3e]">{facture.description}</p>
              </div>
            )}

            {/* Montants */}
            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-500">
                <span>Montant HT</span>
                <span>{facture.amountHT?.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>TVA ({facture.tvaRate ?? 0}%)</span>
                <span>{(facture.tva ?? 0).toFixed(2)} €</span>
              </div>
              {facture.mentionLegale && (
                <p className="text-xs text-gray-400 italic pt-1">{facture.mentionLegale}</p>
              )}
              <div className="flex justify-between font-bold text-[#0d1b3e] text-base pt-3 border-t border-gray-100 mt-2">
                <span>Total TTC</span>
                <span>{facture.totalTTC?.toFixed(2)} €</span>
              </div>
            </div>

            {/* Bouton paiement */}
            {!isPaid ? (
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition text-sm shadow-sm"
              >
                {paying ? "Redirection vers le paiement sécurisé..." : `Payer ${facture.totalTTC?.toFixed(2)} € maintenant`}
              </button>
            ) : (
              <div className="text-center py-3">
                <p className="text-emerald-600 font-semibold text-sm">Paiement confirmé — Merci !</p>
                <p className="text-gray-400 text-xs mt-1">Un reçu vous a été envoyé par email.</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Paiement sécurisé par Stripe · Facturé par {entreprise.nom} via{" "}
          <span className="font-medium">Factur'Peyi</span>
        </p>
      </div>
    </div>
  );
}
