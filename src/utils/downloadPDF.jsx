import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "../components/InvoicePDF";
import DevisPDF from "../components/DevisPDF";
import { makeFacturXBlob } from "./pdfFacturX";

async function convertImageToBase64(url) {
  const proxyUrl = `/api/logo-proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("Logo proxy failed");
  return await res.text();
}

async function resolveLogo({ logoDataUrl, logo }) {
  if (logoDataUrl) return logoDataUrl;
  if (!logo) return "";
  try {
    return await convertImageToBase64(logo);
  } catch (err) {
    console.error("Erreur chargement du logo :", err);
    return "";
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Factures ──────────────────────────────────────────────────────────────

export async function renderInvoicePDFBlob(invoice) {
  const logoDataUrl = await resolveLogo(invoice);
  const visualBlob = await pdf(<InvoicePDF invoice={{ ...invoice, logoDataUrl }} />).toBlob();
  // Factur-X : embarque le XML CII structuré (réforme facture électronique 2026-2027).
  // En cas d'échec d'embarquement, on retombe sur le PDF visuel pour ne jamais bloquer la génération.
  try {
    return await makeFacturXBlob(visualBlob, invoice);
  } catch (err) {
    console.error("Embarquement Factur-X échoué, PDF visuel seul :", err);
    return visualBlob;
  }
}

export async function downloadInvoicePDF(invoice) {
  const blob = await renderInvoicePDFBlob(invoice);
  triggerDownload(blob, `facture-${invoice.id}.pdf`);
}

export async function getInvoicePDFBase64(invoice) {
  const blob = await renderInvoicePDFBlob(invoice);
  return await blobToBase64(blob);
}

// ─── Devis ─────────────────────────────────────────────────────────────────

export async function renderDevisPDFBlob(devis) {
  const logoDataUrl = await resolveLogo(devis);
  return await pdf(<DevisPDF devis={{ ...devis, logoDataUrl }} />).toBlob();
}

export async function downloadDevisPDF(devis) {
  const blob = await renderDevisPDFBlob(devis);
  triggerDownload(blob, `devis-${devis.id}.pdf`);
}

export async function getDevisPDFBase64(devis) {
  const blob = await renderDevisPDFBlob(devis);
  return await blobToBase64(blob);
}
