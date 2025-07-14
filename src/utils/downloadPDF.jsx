import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "../components/InvoicePDF";

/**
 * Convertit une URL d'image vers un dataURL base64 utilisable dans React-PDF
 */
function convertImageToBase64(url) {
  return new Promise((resolve, reject) => {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = proxyUrl;
  });
}


export async function downloadInvoicePDF(invoice) {
  let logoDataUrl = "";

  if (invoice.logo) {
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
