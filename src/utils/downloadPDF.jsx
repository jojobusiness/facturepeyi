import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "../components/InvoicePDF";

async function convertImageToBase64(url) {
  const proxyUrl = `/api/logo-proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("Logo proxy failed");
  return await res.text(); // déjà un data URL base64
}

export async function downloadInvoicePDF(invoice) {
  let logoDataUrl = invoice.logoDataUrl || "";

  if (!logoDataUrl && invoice.logo) {
    try {
      logoDataUrl = await convertImageToBase64(invoice.logo);
    } catch (err) {
      console.error("Erreur chargement du logo :", err);
    }
  }

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
