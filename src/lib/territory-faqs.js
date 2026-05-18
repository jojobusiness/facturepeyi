// Génère des FAQ contextuelles par territoire selon ses caractéristiques fiscales.
// Utilisé côté SEO (rich snippets Google FAQPage) + affichage visuel sur TerritoirePage.

export function buildFaqs(t) {
  const faqs = [];

  // ─── Q1 : Taux de TVA / TGC ─────────────────────────────────────────────────
  if (t.tvaRate === "0%") {
    if (t.mentionLegale?.includes("article 294")) {
      faqs.push({
        q: `Pourquoi la TVA est-elle à 0 % en ${t.name} ?`,
        a: `L'article 294 du Code Général des Impôts (CGI) prévoit que la TVA n'est pas applicable en ${t.name}. Cela signifie qu'aucun pourcentage de TVA n'est ajouté à vos factures. En contrepartie, vous devez obligatoirement faire figurer une mention légale spécifique sur chaque facture émise. Factur'Peyi gère cette particularité automatiquement dès votre inscription.`,
      });
    } else {
      faqs.push({
        q: `Quel est le régime de TVA à ${t.name} ?`,
        a: `À ${t.name}, la TVA n'est pas applicable. Factur'Peyi configure automatiquement votre compte avec ce régime spécifique et gère les mentions légales obligatoires sur vos factures.`,
      });
    }
  } else if (t.tvaRate === "11%") {
    faqs.push({
      q: `Qu'est-ce que la TGC en ${t.name} ?`,
      a: `La TGC (Taxe Générale sur la Consommation) est l'équivalent calédonien de la TVA. Son taux normal est de 11 %. Elle s'applique sur les biens et services vendus en Nouvelle-Calédonie. Factur'Peyi intègre nativement ce taux et la mention légale correspondante sur chaque facture.`,
    });
  } else if (t.tvaRate === "16%") {
    faqs.push({
      q: `Quel est le taux de TVA en ${t.name} ?`,
      a: `Le taux de TVA en Polynésie française est de 16 %. Toutes les entreprises et indépendants assujettis doivent l'appliquer sur leurs ventes de biens et services. Factur'Peyi calcule et affiche automatiquement ce taux sur vos factures dès que vous sélectionnez la Polynésie française dans vos paramètres.`,
    });
  } else {
    // 8,5%
    faqs.push({
      q: `Quel taux de TVA appliquer en ${t.name} ?`,
      a: `En ${t.name}, le taux de TVA DOM applicable est de 8,5 %. C'est un taux réduit spécifique aux Départements et Régions d'Outre-Mer. Factur'Peyi pré-remplit ce taux dès la création de votre compte et l'applique automatiquement à toutes vos factures.`,
    });
  }

  // ─── Q2 : Octroi de mer (si applicable) ─────────────────────────────────────
  if (t.octroiDeMer) {
    faqs.push({
      q: `Qu'est-ce que l'Octroi de mer et qui doit le payer en ${t.name} ?`,
      a: `L'Octroi de mer est une taxe locale spécifique aux Départements d'Outre-Mer, qui s'applique sur les importations de marchandises et certaines productions locales. En ${t.name}, vous devez le déclarer si vous importez des biens pour votre activité. Factur'Peyi inclut un champ dédié à l'Octroi de mer dans les dépenses et le récapitule dans votre déclaration fiscale trimestrielle.`,
    });
  }

  // ─── Q3 : Mention légale (si TVA 0% art 294 ou similaire) ───────────────────
  if (t.mentionLegale && t.mentionLegale !== "TVA non applicable") {
    faqs.push({
      q: `Que dois-je écrire sur ma facture sans TVA à ${t.name} ?`,
      a: `La mention légale obligatoire à inscrire sur chaque facture est : « ${t.mentionLegale} ». Sans cette mention, votre facture peut être contestée. Factur'Peyi ajoute automatiquement cette mention au bas de chaque facture PDF, sans aucune action de votre part.`,
    });
  } else if (t.mentionLegale === "TVA non applicable") {
    faqs.push({
      q: `Comment facturer mes clients à ${t.name} sans TVA ?`,
      a: `À ${t.name}, vos factures ne comportent pas de ligne TVA, mais doivent indiquer la mention « TVA non applicable » pour être conformes. Factur'Peyi génère des factures PDF directement conformes aux règles locales.`,
    });
  }

  // ─── Q4 : Régimes fiscaux (auto-entrepreneur, micro-BIC, etc.) ──────────────
  faqs.push({
    q: `Quels régimes fiscaux sont supportés en ${t.name} ?`,
    a: `Factur'Peyi gère les principaux régimes fiscaux applicables aux entrepreneurs : auto-entrepreneur (micro-entreprise avec franchise de TVA), micro-BIC (Bénéfices Industriels et Commerciaux), micro-BNC (Bénéfices Non Commerciaux), et le régime réel. Selon votre choix, le logiciel adapte automatiquement les mentions légales et le calcul de votre TVA.`,
  });

  // ─── Q5 : Déclaration & comptabilité ────────────────────────────────────────
  faqs.push({
    q: `Comment Factur'Peyi m'aide-t-il à gérer ma comptabilité en ${t.name} ?`,
    a: `Factur'Peyi inclut un journal comptable, un plan comptable, un bilan, une déclaration fiscale automatique et un calendrier fiscal spécifique aux DOM-TOM. Vos factures, devis et dépenses alimentent automatiquement votre comptabilité. Vous pouvez aussi exporter vos données en PDF ou Excel pour les transmettre à votre expert-comptable.`,
  });

  // ─── Q6 : Essai et tarifs ───────────────────────────────────────────────────
  faqs.push({
    q: "L'essai gratuit est-il vraiment sans engagement ?",
    a: "Oui. L'essai de 30 jours ne nécessite aucune carte bancaire et n'a aucun engagement. À la fin, votre compte bascule automatiquement en plan Découverte gratuit (5 factures par mois) si vous ne choisissez pas de formule payante. Vous conservez toujours l'accès à vos données.",
  });

  return faqs;
}

// Construit le JSON-LD Schema.org FAQPage pour rich snippets Google
export function buildFaqJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}
