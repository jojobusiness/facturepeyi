import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

function fmtEur(n) {
  return `${Number(n ?? 0).toFixed(2)} €`;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d)
    ? ""
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function EntetePro({ entreprise }) {
  return (
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
  );
}

function DeEtA({ entreprise, client }) {
  return (
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
        {client.email && <p className="text-gray-500 text-xs mt-0.5">{client.email}</p>}
        {client.adresse && <p className="text-gray-400 text-xs mt-0.5">{client.adresse}</p>}
      </div>
    </div>
  );
}

// ─── Vue DEVIS ───────────────────────────────────────────────────────────────

function VueDevis({ data, token, onRefresh }) {
  const { devis, entreprise, client } = data;

  const [nom, setNom] = useState(client.nom || "");
  const [formOuvert, setFormOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [decision, setDecision] = useState(null); // "accepté" | "refusé" après action locale

  const statut = decision || devis.status;
  const estAccepte = statut === "accepté";
  const estRefuse = statut === "refusé";
  const estExpire = !estAccepte && !estRefuse && (devis.expired || statut === "expiré");
  const decidable = !estAccepte && !estRefuse && !estExpire;

  const envoyerDecision = async (action) => {
    setErreur(null);
    if (action === "accept" && nom.trim().length < 2) {
      setErreur("Merci d'indiquer votre nom pour valider l'acceptation.");
      return;
    }
    setEnvoi(true);
    try {
      const r = await fetch("/api/devis-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nom: nom.trim(), action }),
      });
      const d = await r.json();
      if (r.ok) {
        setDecision(d.status);
        return;
      }
      if (d.error === "already_decided" || d.error === "expired") {
        onRefresh();
        return;
      }
      setErreur(
        d.error === "nom_requis"
          ? "Merci d'indiquer votre nom."
          : "Une erreur est survenue. Réessayez dans un instant."
      );
    } catch {
      setErreur("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setEnvoi(false);
    }
  };

  const bandeau = estAccepte
    ? { texte: "✓ Devis accepté", classes: "bg-emerald-50 border-emerald-100 text-emerald-700" }
    : estRefuse
      ? { texte: "Devis décliné", classes: "bg-gray-50 border-gray-100 text-gray-500" }
      : estExpire
        ? { texte: "Devis expiré", classes: "bg-red-50 border-red-100 text-red-600" }
        : { texte: "En attente de votre réponse", classes: "bg-amber-50 border-amber-100 text-amber-700" };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-4 flex items-center justify-between border-b ${bandeau.classes}`}>
          <span className="text-sm font-semibold">{bandeau.texte}</span>
          <span className="text-2xl font-bold text-[#0d1b3e]">{fmtEur(devis.totalTTC)}</span>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="font-bold text-[#0d1b3e]">Devis {devis.numero}</p>
            {devis.date && (
              <p className="text-sm text-gray-400">Émis le {fmtDate(devis.date)}</p>
            )}
          </div>

          <DeEtA entreprise={entreprise} client={client} />

          {/* Validité — mise en avant, c'est le déclencheur de décision */}
          {devis.dateExpiration && decidable && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm">
              <span className="text-amber-800">
                Ce devis est valable jusqu'au{" "}
                <strong>{fmtDate(devis.dateExpiration)}</strong>.
              </span>
            </div>
          )}

          {/* Détail des lignes */}
          {devis.lignes?.length > 0 ? (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Prestation</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Qté</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">P.U. HT</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {devis.lignes.map((l, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-[#0d1b3e]">{l.description}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{l.quantite}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{fmtEur(l.prixUnitaire)}</td>
                      <td className="px-4 py-3 text-right font-medium text-[#0d1b3e]">
                        {fmtEur((Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : devis.description ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">Prestation</p>
              <p className="text-sm text-[#0d1b3e]">{devis.description}</p>
            </div>
          ) : null}

          {/* Totaux */}
          <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
            <div className="flex justify-between text-gray-500">
              <span>Montant HT</span>
              <span>{fmtEur(devis.amountHT)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>TVA ({devis.tvaRate ?? 0}%)</span>
              <span>{fmtEur(devis.tva)}</span>
            </div>
            {devis.mentionLegale && (
              <p className="text-xs text-gray-400 italic pt-1">{devis.mentionLegale}</p>
            )}
            <div className="flex justify-between font-bold text-[#0d1b3e] text-base pt-3 border-t border-gray-100 mt-2">
              <span>Total TTC</span>
              <span>{fmtEur(devis.totalTTC)}</span>
            </div>
          </div>

          {/* Décision */}
          {estAccepte ? (
            <div className="text-center py-3">
              <p className="text-emerald-600 font-semibold text-sm">
                Devis accepté{devis.acceptedAt ? ` le ${fmtDate(devis.acceptedAt)}` : ""} — merci !
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {entreprise.nom} a été prévenu et va prendre contact avec vous.
              </p>
            </div>
          ) : estRefuse ? (
            <div className="text-center py-3">
              <p className="text-gray-500 font-medium text-sm">Vous avez décliné ce devis.</p>
              <p className="text-gray-400 text-xs mt-1">
                Vous pouvez contacter {entreprise.nom} si votre besoin évolue.
              </p>
            </div>
          ) : estExpire ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm">
              <p className="font-medium text-[#0d1b3e]">Ce devis a dépassé sa date de validité</p>
              <p className="text-gray-400 text-xs mt-1">
                Contactez {entreprise.nom} pour obtenir un devis à jour.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {!formOuvert ? (
                <button
                  onClick={() => setFormOuvert(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition text-sm shadow-sm"
                >
                  ✓ J'accepte ce devis
                </button>
              ) : (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-600">Votre nom et prénom</span>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Ex : Marie Dupont"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    En validant, vous acceptez ce devis aux conditions indiquées ci-dessus.
                    Votre acceptation est horodatée et transmise à {entreprise.nom}.
                  </p>
                  <button
                    onClick={() => envoyerDecision("accept")}
                    disabled={envoi}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition text-sm"
                  >
                    {envoi ? "Validation..." : "Valider mon acceptation"}
                  </button>
                </div>
              )}

              {erreur && (
                <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">
                  {erreur}
                </p>
              )}

              <button
                onClick={() => envoyerDecision("refuse")}
                disabled={envoi}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition py-1 disabled:opacity-50"
              >
                Je décline ce devis
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 mt-6">
        Devis émis par {entreprise.nom} via <span className="font-medium">Factur'Peyi</span>
      </p>
    </>
  );
}

// ─── Vue FACTURE ─────────────────────────────────────────────────────────────

function VueFacture({ data, token, justPaid }) {
  const { facture, entreprise, client } = data;
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const isPaid = facture.status === "payée" || justPaid;

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);
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
        return;
      }
      setPayError(d.message || d.error || "Erreur inattendue. Réessayez.");
    } catch {
      setPayError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-4 flex items-center justify-between ${isPaid ? "bg-emerald-50 border-b border-emerald-100" : "bg-amber-50 border-b border-amber-100"}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
              {isPaid ? "✓ Facture payée" : "En attente de paiement"}
            </span>
          </div>
          <span className="text-2xl font-bold text-[#0d1b3e]">{fmtEur(facture.totalTTC)}</span>
        </div>

        <div className="p-6 space-y-6">
          <DeEtA entreprise={entreprise} client={client} />

          {facture.date && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Date :</span>
              <span className="text-[#0d1b3e] font-medium">{fmtDate(facture.date)}</span>
            </div>
          )}

          {facture.description && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">Prestation</p>
              <p className="text-sm text-[#0d1b3e]">{facture.description}</p>
            </div>
          )}

          <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
            <div className="flex justify-between text-gray-500">
              <span>Montant HT</span>
              <span>{fmtEur(facture.amountHT)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>TVA ({facture.tvaRate ?? 0}%)</span>
              <span>{fmtEur(facture.tva)}</span>
            </div>
            {facture.mentionLegale && (
              <p className="text-xs text-gray-400 italic pt-1">{facture.mentionLegale}</p>
            )}
            <div className="flex justify-between font-bold text-[#0d1b3e] text-base pt-3 border-t border-gray-100 mt-2">
              <span>Total TTC</span>
              <span>{fmtEur(facture.totalTTC)}</span>
            </div>
          </div>

          {isPaid ? (
            <div className="text-center py-3">
              <p className="text-emerald-600 font-semibold text-sm">Paiement confirmé — Merci !</p>
              <p className="text-gray-400 text-xs mt-1">Un reçu vous a été envoyé par email.</p>
            </div>
          ) : entreprise.hasStripeConnect ? (
            <div className="space-y-3">
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition text-sm shadow-sm"
              >
                {paying ? "Redirection vers le paiement sécurisé..." : `Payer ${fmtEur(facture.totalTTC)} maintenant`}
              </button>
              {payError && (
                <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">
                  {payError}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
              <p className="font-medium text-[#0d1b3e]">Paiement en ligne non disponible</p>
              <p className="text-gray-400 text-xs mt-1">
                Contactez directement {entreprise.nom} pour régler cette facture.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 mt-6">
        Paiement sécurisé par Stripe · Facturé par {entreprise.nom} via{" "}
        <span className="font-medium">Factur'Peyi</span>
      </p>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortailClient() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get("paid") === "true";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const charger = () => {
    setLoading(true);
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
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [token]);

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
          <p className="text-sm text-gray-400 mt-2">Ce lien n'est plus disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <EntetePro entreprise={data.entreprise} />
        {data.kind === "devis" ? (
          <VueDevis data={data} token={token} onRefresh={charger} />
        ) : (
          <VueFacture data={data} token={token} justPaid={justPaid} />
        )}
      </div>
    </div>
  );
}
