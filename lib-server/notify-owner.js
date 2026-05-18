// Helper pour envoyer un email transactionnel au propriétaire d'une entreprise
// (sur changement d'abonnement, échec paiement, etc.). Utilise Resend.

const FROM = "Factur'Peyi <noreply@facturepeyi.com>";

export async function notifyOwner(db, entrepriseId, { subject, html }) {
  if (!process.env.RESEND_API_KEY) return false;

  try {
    const entrepriseSnap = await db.collection("entreprises").doc(entrepriseId).get();
    const entrepriseData = entrepriseSnap.data();
    if (!entrepriseData?.ownerUid) return false;

    const ownerSnap = await db.collection("utilisateurs").doc(entrepriseData.ownerUid).get();
    const ownerEmail = ownerSnap.data()?.email;
    if (!ownerEmail) return false;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: [ownerEmail], subject, html }),
    });
    return true;
  } catch (err) {
    console.error("notifyOwner failed:", err.message);
    return false;
  }
}

export function emailShell({ title, intro, ctaLabel, ctaUrl, footerNote }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#111">
      <div style="margin-bottom:24px">
        <span style="font-size:22px;font-weight:900;color:#059669">Factur'Peyi</span>
      </div>
      <h2 style="color:#0d1b3e;margin:0 0 12px;font-size:20px">${title}</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 20px">${intro}</p>
      ${ctaUrl && ctaLabel ? `
        <p style="margin:24px 0">
          <a href="${ctaUrl}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700">${ctaLabel}</a>
        </p>
      ` : ""}
      ${footerNote ? `<p style="color:#777;font-size:13px;line-height:1.6;margin-top:20px">${footerNote}</p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px"/>
      <p style="color:#aaa;font-size:12px;margin:0">
        Factur'Peyi · Le logiciel de facturation des DOM-TOM
      </p>
    </div>
  `;
}
