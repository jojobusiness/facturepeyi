// Enregistre la police Inter (TTF embarquée) pour les PDF react-pdf.
// CRITIQUE pour le PDF/A-3b : les polices standard non-embarquées (Helvetica) sont
// INTERDITES en PDF/A. En embarquant Inter (subset latin, glyphes € + accents vérifiés),
// react-pdf intègre la police dans le PDF → condition nécessaire pour valider Factur-X.

import { Font } from "@react-pdf/renderer";
import InterRegular from "../assets/fonts/Inter-Regular.ttf";
import InterBold from "../assets/fonts/Inter-Bold.ttf";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  Font.register({
    family: "Inter",
    fonts: [
      { src: InterRegular, fontWeight: 400 },
      { src: InterBold, fontWeight: 700 },
    ],
  });
  // Pas de césure automatique (évite les coupures de mots hasardeuses dans les PDF)
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
