import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "../components/InvoicePDF";

/**
 * Convertit une URL d'image vers un dataURL base64 utilisable dans React-PDF
 */
async function toDataURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadInvoicePDF(invoice) {
  let logoDataUrl = "";

  // 🔁 Convertir l'URL Firebase Storage en DataURL (base64)
  if (invoice.logoUrl) {
    try {
      const response = await fetch(invoice.logoUrl, { mode: "cors" });
      const blob = await response.blob();

      // Lire le blob en base64
      logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Erreur chargement du logo :", err);
    }
  }

  // 🧾 Générer le PDF avec le logo en base64
  const blob = await pdf(
    <InvoicePDF invoice={{ ...invoice, logoDataUrl }} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `facture-${invoice.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}