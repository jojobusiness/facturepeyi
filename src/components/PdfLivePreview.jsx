import { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";
import DevisPDF from "./DevisPDF";

/**
 * Aperçu PDF live (debounce) d'une facture ou d'un devis en cours d'édition.
 * Le PDF se régénère ~`delay` ms après la dernière modification du formulaire.
 *
 * @param {object} invoice  contexte enrichi (mêmes champs que InvoicePDF/DevisPDF)
 * @param {"facture"|"devis"} kind
 */
export default function PdfLivePreview({ invoice, kind = "facture", delay = 500 }) {
  const [debounced, setDebounced] = useState(invoice);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(invoice), delay);
    return () => clearTimeout(t);
  }, [invoice, delay]);

  const Doc = kind === "devis" ? DevisPDF : InvoicePDF;
  const docProps = kind === "devis" ? { devis: debounced } : { invoice: debounced };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
      <PDFViewer
        showToolbar={false}
        style={{ width: "100%", height: "78vh", border: "none" }}
      >
        <Doc {...docProps} />
      </PDFViewer>
    </div>
  );
}
