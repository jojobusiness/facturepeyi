# Shortlist PDP — devenir Opérateur de Dématérialisation (OD)

> Objectif : ne PAS devenir PDP soi-même (ISO 27001, SecNumCloud, immatriculation DGFiP 3 ans,
> centaines de milliers d'€). On se **raccorde à une PDP agréée via son API** → FacturPeyi devient
> *Opérateur de Dématérialisation*, conforme réforme 2026-2027, sans porter le fardeau réglementaire.
>
> État du marché (mai 2026) : **134 plateformes agréées** immatriculées par l'État.
> La liste officielle est sur impots.gouv.fr.

---

## Le critère de tri qui compte

On cherche une PDP qui soit :
1. **API-first / pensée pour les éditeurs** (on branche FacturPeyi dessus, pas l'inverse).
2. **Factur-X + UBL + CII en émission ET réception**, point d'accès **Peppol**, e-reporting.
3. **Neutre** : qui ne nous concurrence PAS sur la facturation/compta TPE.
4. Tarif au volume raisonnable (set-up + coût/facture).

🚩 **Piège à éviter absolument : ne pas se raccorder à une PDP qui est aussi un concurrent.**
Pennylane, Sage, Cegid, Tiime, Qonto, Indy… sont des PDP **mais aussi des outils de facturation/compta**.
Leur donner nos flux = nourrir un concurrent + dépendance stratégique. À écarter comme partenaire d'infra.

---

## Candidat n°1 (recommandé) — **Iopole**

- **Pure player full API**, explicitement « PDP pour éditeurs de logiciels », sans concurrence logicielle (ne fait pas d'outil de facturation → ne nous marche pas dessus). C'est exactement notre cas d'usage.
- Formats **Factur-X / UBL / CII** en émission + réception ; **point d'accès Peppol** ; archivage légal à valeur probante ; onboarding client final avec vérification d'identité.
- **ISO 27001 + hébergement SecNumCloud en France**, immatriculée DGFiP.
- Tarif : **sur devis** (set-up + coût au volume) — pas de grille publique, contacter le commercial.
- Sites : iopole.com/developpeurs (doc API), iopole.com/tarifs, iopole.com/plateforme-agreee-france.

**Pourquoi c'est le bon départ :** on garde notre produit (UI, fiscalité DOM, multi-lignes, Factur-X qu'on génère déjà), Iopole ne fait QUE le routage PDP + Peppol + e-reporting + archivage. On reste maître de l'expérience.

## Candidat n°2 (comparaison/négo) — **b2brouter**

- PDP/API multi-pays, orientée intégration, tarifs réputés accessibles. Utile comme 2e devis pour négocier Iopole.

## Candidats « entreprise » (si on grossit) — **Docaposte**, **Esker**

- Robustes, institutionnels (Docaposte = groupe La Poste). Plus lourds/chers, plutôt pour gros volumes. À garder en réserve.

---

## Ce qu'on a déjà fait côté FacturPeyi (et qui réduit le coût d'intégration)

- ✅ On **génère déjà le Factur-X PDF/A-3b** (validé veraPDF : 1623 checks, 0 échec). La PDP n'a plus qu'à
  router le XML qu'on produit — l'essentiel du travail structuré est fait de notre côté.
- ✅ Données fiscales DOM propres (TVA territoire, octroi de mer, mentions, multi-lignes, n° TVA).
- → L'intégration se résume à : appeler l'API de la PDP pour **émettre / recevoir / e-reporter**, gérer
  l'annuaire (SIREN destinataires) et les statuts de cycle de vie (déposée, reçue, encaissée…).

---

## Prochaines étapes concrètes

1. **Demander un devis Iopole** (volume estimé : nb factures/mois prévisionnel) + accès à la doc API dev.
2. Demander un 2e devis **b2brouter** pour comparer/négocier.
3. Cadrer l'intégration technique : endpoints émission/réception, mapping de notre Factur-X, gestion des
   statuts de cycle de vie, annuaire destinataires, e-reporting Guyane/Mayotte (factures HT, art. 294).
4. Vérifier la prise en charge fine des **spécificités DROM** (e-reporting pour Guyane/Mayotte, octroi de mer).

Lié à : `docs/PACK_DEMARCHAGE_CABINETS.md` (« raccordement PDP en cours via partenaire »),
mémoire `project_reforme_einvoicing.md`.

Sources : impots.gouv.fr (liste officielle), economie.gouv.fr (annuaire), iopole.com, dougs.fr, qonto.com.
