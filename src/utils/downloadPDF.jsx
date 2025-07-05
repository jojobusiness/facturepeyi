import React from "react";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "../components/InvoicePDF";

export async function downloadInvoicePDF(invoice) {
  const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `facture-${invoice.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}