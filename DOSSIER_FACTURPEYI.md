# DOSSIER FACTUR'PEYI — Consolidation complète

> Document de synthèse remontant **toutes les infos et mémoires** relatives à Factur'Peyi.
> Généré le 13/06/2026. Source : système mémoire `.claude/.../memory/` + code du dépôt.
> Mémoires hidden (AppData) consolidées ici pour accès portable depuis OneDrive.

---

## 1. Identité du projet

**Factur'Peyi** (facturepeyi.com) — SaaS de facturation et de gestion d'entreprise ciblant les **artisans, commerçants et indépendants des DOM-TOM** (Antilles, Guyane, Réunion, Mayotte…).

- **Stack :** React 19 + Vite + Tailwind 3 + Firebase (Auth/Firestore/Storage) + Stripe + Resend + Vercel.
- **Domaine canonique :** `www.facturepeyi.com` (l'apex redirige en 307 — voir §7).
- **Document vision :** `AMELIORATIONS.md` à la racine du dépôt.

### Avantage concurrentiel absolu (le wedge)
Seul logiciel pensé pour la fiscalité DOM-TOM : **TVA 0% Guyane (art. 294), 8,5% Antilles/Réunion, octroi de mer, régimes micro-BIC/BNC, mentions légales automatiques par territoire** (12 territoires configurés dans `src/lib/territories.js`). QuickBooks, Sage, Pennylane, Tiime, Cegid gèrent la métropole mais **pas** les spécificités DOM → fenêtre d'opportunité réelle. Concurrent repéré : **FacturDOM.re** (Réunion) — Joseph en avance mais pas seul, la vitesse compte.

---

## 2. Entité juridique & profil fondateur

**Joseph TWIZEYIMANA** — entrepreneur individuel (EI), nom commercial **Jojo Empire**.
- **SIREN : 105 341 036** · **SIRET : 10534103600017**
- **APE/NAF : 6202A** (Conseil en systèmes et logiciels informatiques)
- **Siège :** 29 Rue Daviel, 75013 Paris
- **Régime :** Micro-BNC + franchise en base TVA → mention « TVA non applicable, art. 293 B du CGI »
- **Contact :** contact@facturepeyi.com
- Formalité **J00243987047** validée le **21/05/2026** par INSEE + URSSAF.
- Une seule EI couvre **Factur'Peyi ET EduKaraib** (activité « Services informatiques »).
- Perçoit l'ARE (chômage) — cumul auto-entrepreneur légal, déclaré à France Travail.

**Profil de travail :** comprend bien le produit/business, moins le technique bas niveau. Veut des résultats concrets rapides. Veut du business (commission 2,5% assumée, pas d'associatif). Réagit bien aux conseils directs et tranchés. Ne lâche pas.

---

## 3. État du produit — features livrées (Sprints 0 → 4)

### Sprint 0 — Socle
Firestore rules sécurisées · landing refondue (hero + floating cards) · 4 forfaits · fiscalité 12 territoires · inscription 2 étapes · police Inter.

### Sprint 1
Dashboard KPIs (CA, impayés, taux recouvrement) · emails transactionnels Resend · onboarding guidé 5 étapes.

### Sprint 2
Module devis + conversion en facture · rappels de paiement auto J+7/J+15/J+30 (cron Vercel) · navigation restructurée (Ventes/Achats/Comptabilité).

### Sprint 3 — DOM-TOM avancé
Octroi de mer dans dépenses + déclaration · régimes fiscaux avancés (Settings) · calendrier fiscal avec rappels J-14/J-30 · PWA mobile (manifest + Apple meta).

### Sprint 4 — Scale
- **Plan Cabinet** (multi-entreprises, switch, commission) — vendable 99,99€/mois · 999€/an (2 mois offerts).
- **Programme de parrainage** + **prescription cabinet 25%** (`/dashboard/prescription`, gated `isCabinet`).
- **Factures/devis multi-lignes** + **aperçu PDF live**.
- **Paramètres fiscaux complets** (adresse, n° TVA, IBAN/BIC, mentions) → PDF + Factur-X.
- **Factur-X** : XML CII EN 16931 BASIC embarqué, **PDF/A-3b validé veraPDF (1623 checks, 0 échec)**.
- **Import bancaire CSV/OFX** · **Export FEC** conforme A.47 A-1 LPF (TVA séparée).
- 🔶 Reste : pages SEO par territoire (partiel — TerritoirePage existe), gestion SCIs/holding (Phase 3-4).

### Autres briques livrées (revenue audit 18/05)
Portail client `/portail/:token` (paiement sans compte) · Stripe Connect 2,5% · factures récurrentes · acompte + facture de solde · envoi facture/devis par email en 1 clic (PDF + lien Stripe) · `/sysadmin` super-admin (KPIs MRR, suspension, logs) · `/mon-abonnement` + Stripe Customer Portal · cron trial→paid (4 emails J-15/7/3/1) · TrialBanner · FAQ JSON-LD · pages légales refondues (CGU/CGV/Confidentialité/Cookies/Remboursement).

---

## 4. Tarification

| Plan | Prix | Notes |
|---|---|---|
| Découverte | Gratuit (5 factures) | Bypass Stripe → **acquisition possible sans Stripe** |
| Solo | 19,99 €/mois · **199 €/an** | Illimité, 1 utilisateur |
| Pro | 34,99 €/mois · **349 €/an** | Multi-users, récurrences, portail client |
| Expert | 54,99 €/mois · **549 €/an** | Import bancaire, multi-projets |
| **Cabinet** | **99,99 €/mois · 999 €/an** | Multi-entreprises, 2 mois offerts (trial 60j) |
| **Pionnier (Lifetime)** | **199 € one-shot** | Accès Solo à vie, **cap 50 places** |

> Décision tranchée : annuel = **2 mois offerts** (~17%), pas -30% (protège la marge, format standard SaaS).
> Price IDs réels en prod (commit b77e344) : Pionnier `price_1TdcJZIck4iMBRE9KizjlK9I`, Solo annuel `price_1TdcN9...`, Pro annuel `price_1TdcPb...`, Expert annuel `price_1TdcS5...`.

---

## 5. Stripe — état et architecture

### Comptes
**2 comptes Stripe à entité juridique PARTAGÉE** (modifier le SIREN sur l'un propage aux deux) :
- `acct_1S0SrXRPeJcWf03W` → EduKaraib.com
- `acct_1RlBmGlck4iMBRE9` → facturepeyi.com

### Stripe Connect (commission 2,5%)
Architecture **destination charges + `on_behalf_of`** + `application_fee_amount` 2,5% (non négociable). OAuth complet (`stripe-connect-oauth` → callback → disconnect). Flow facture payée : checkout `metadata.type=invoice_payment` → webhook `checkout.session.completed` → facture `status:"payée"` + email Resend.

### Statut KYC / payouts
- ✅ SIREN **105 341 036** saisi dans Stripe (21/05) — encaissement OK.
- ⚠️ Historique : payouts suspendus depuis 17/05 (KYC standard exigeant le SIREN). À surveiller : raison sociale Stripe doit être **Joseph Twizeyimana** (pas « Factur'Péyi » qui n'est pas une entité juridique) — sinon re-blocage à la vérif API Sirene. DBA = Jojo Empire.

### Variables Vercel (prod)
`STRIPE_SECRET_KEY` (sk_live) · `STRIPE_CONNECT_CLIENT_ID` (ca_…) · `STRIPE_WEBHOOK_SECRET` · `NEXT_PUBLIC_SITE_URL=https://www.facturepeyi.com` · `FIREBASE_SERVICE_ACCOUNT_JSON` · `RESEND_API_KEY` · `CRON_SECRET`.

---

## 6. Réforme facture électronique 2026-2027 — ENJEU EXISTENTIEL

### Calendrier (confirmé 80e Congrès Ordre, sept 2025)
- **1er sept 2026** : toutes les entreprises doivent pouvoir **RECEVOIR** des factures électroniques via PDP. Grandes entreprises + ETI émettent.
- **1er sept 2027** : PME/TPE doivent **ÉMETTRE** au format structuré via PDP.

### Le finding
Le **PDF seul n'est PAS conforme**. Il faut un **format structuré** (Factur-X = PDF/A-3 + XML CII, ou UBL/CII) transitant par une **PDP agréée** (Plateforme de Dématérialisation Partenaire).

### Géométrie DOM (avantage sous-exploité)
- Martinique/Guadeloupe : e-invoicing complet (TVA 8,5% / 2,1%).
- Guyane/Mayotte : pas d'e-invoicing (art. 294) → **e-reporting** (sanction 250€/transmission, plafond 15 000€/an).
- Tous DROM : octroi de mer → déclaration **DOMINO-NG** obligatoire depuis 01/07/2024 (amende 750€).

### État Factur'Peyi
- ✅ **Factur-X généré et PDF/A-3b validé veraPDF** → on peut pitcher « Factur-X validé PDF/A-3b » sans risque.
- 🔶 **Raccordement PDP = chantier séparé** (devenir Opérateur de Dématérialisation, PAS une PDP). Candidat n°1 = **Iopole** (API-first, neutre, Factur-X/UBL/CII, Peppol, ISO27001/SecNumCloud). Alt : b2brouter. 🚩 NE PAS partenaire avec PDP concurrentes (Pennylane/Sage/Cegid/Tiime/Qonto). **Next : demander devis Iopole + b2brouter.**

---

## 7. Stratégie commerciale

### Levier principal = PRESCRIPTION cabinets (25% commission récurrente)
Un expert-comptable = **canal de distribution**, pas un client. 1 cabinet DOM = 30-300 entreprises clientes. Le cabinet recommande → chaque client s'abonne → **25% commission récurrente à vie** au cabinet (ex : 20 clients Solo × 19,99€ × 25% ≈ 100€/mois au cabinet ; ~300€/mois net récurrent pour Joseph).

- Le **plan Cabinet 99,99€** est **secondaire** (la plupart des cabinets ne font pas la facturation de leurs clients).
- **Ce que le cabinet veut** (ordre) : 1) données propres (factures DOM conformes), 2) **sortir les données** (FEC ✅ livré), 3) paraître moderne, 4) revenu (closer).
- **Pitch par la douleur** : « Vos clients ultramarins vous envoient des factures non conformes que vous corrigez. FacturPeyi les génère 100% conformes par territoire. Partenariat : eux gagnent un outil conforme, vous gagnez du temps + 25% de commission. 15 min ? »
- ⚠️ Pour les démarchages : **être honnête** sur le Factur-X/PDP — Factur-X validé ✅, raccordement PDP « en cours ». Ces gens connaissent la réforme par cœur.
- Idée commission transactionnelle (split 2,5% Connect) = **RANGÉE** (imprévisible car DOM paie surtout par virement, +friction, Connect fragile).
- Kit prêt : `docs/PACK_DEMARCHAGE_CABINETS.md`, `docs/DEMARCHAGE_J1.md`, `docs/prospection_cabinets.csv`, `docs/PDP_SHORTLIST.md`, `docs/COURS_FISCALITE_DOM.md`.

### 5 mécanismes de monétisation (rankés ROI/effort)
1. **Lifetime Pionnier 199€** (cash immédiat) — ✅ livré.
2. **Plans annuels** (2 mois offerts) — ✅ livré.
3. **Démarchage cabinets** (prescription 25%) — kit prêt, à exécuter.
4. **Free tool** « Calculateur TVA DOM-TOM » (lead magnet SEO) — à faire.
5. **Pages SEO 5 territoires** prioritaires — à faire.

### Acquisition (stratégie 0€ à réactiver)
Groupes Facebook entrepreneurs DOM · DM artisans/auto-entrepreneurs · experts-comptables locaux · CCI DOM · WhatsApp Business · SEO compound (4 articles).

### Pub Meta (en préparation — 13/06)
Voir `Factur'Peyi/facturpeyi/PLAN_PUBS_META.md` + `TUTO_PIXEL_META.md`. Test froid 2 angles (réforme 2026 + fiscalité DOM-TOM) sur landing dédiée, optimisé `CompleteRegistration` (essai). Retargeting Pionnier en semaine 2. Budget géré avec Théo, monter sur signal uniquement.

---

## 8. Lead organique #1 (référence Guyane)

- **DOUGLAS Élie** — eliconia.sas@gmail.com — entreprise **ÉLICONIA** (Guyane).
- Régime micro-BIC, TVA art. 294, octroi de mer false. Plan Découverte, trial fin **13/06/2026**.
- ⚠️ Incohérence à éclaircir : email contient « SAS » mais régime micro-BIC.
- Premier inscrit organique de l'histoire du produit (14/05/2026, sans marketing). Sa source d'acquisition = directive de réplication. Sa conversion = première référence Guyane marketing.

---

## 9. Leçons techniques (à ne jamais re-perdre)

1. **Domaine webhook = `www.facturepeyi.com`** (apex → 307, et les webhooks ne suivent pas les redirects). Stripe a échoué 381 fois sur l'apex le 18/05. Tout webhook entrant (Stripe, Resend, OAuth callback) doit être préfixé `www.`.
2. **Packages serveur dans `package.json`** : un package « extraneous » (`npm list`) crashe en prod (FUNCTION_INVOCATION_FAILED) car Vercel n'installe que le déclaré. Concerne `firebase-admin`, `resend`, `stripe`.
3. **`.trim()` toutes les env vars sensibles** (Joseph colle parfois des `\n` parasites → `%0A` dans les URLs → « No application matches the supplied client identifier »). Pour les URLs : `.replace(/\/$/, "")` en plus.
4. **Pionnier (paiement unique)** : au webhook, mettre `planStatus:"active"` + `trialEndsAt:null` SINON `getPlanStatus()` renvoie « expired » et verrouille un client qui vient de payer. Le gating lit `entreprise.plan` (pas `lifetime`).
5. **`firebase deploy --only firestore:rules`** est manuel — un `git push` ne déploie pas les règles Firestore.
6. **Hero LP locked** (commit `cddcb35`) : cards flottantes en overlay sur le dashboard mockup. NE PAS restaurer l'ancien design stacké. Joseph s'est agacé 2 fois.

---

## 10. Roadmap par priorité ROI

### Quick wins (< 3,5 j) — vélocité de facturation → upgrade naturel
Catalogue produits/services · filtres date+statut InvoiceList · dupliquer facture · export CSV depuis listes.

### Upsell Pro → Expert (3-7 j chacun)
P&L mensuel + cashflow forecast (killer feature) · signature électronique sur devis · rapprochement bancaire auto.

### Expansion territoires
Multi-devises XPF (Pacifique, Stripe ne supporte pas)/HTG (Haïti) · pages SEO territoires.

### Phase 3-4 (500+ / 2000+ clients)
SCIs d'abord (très courant aux DOM), puis module add-on « Factur'Peyi Patrimoine » (~29,99€/mois : multi-entités, consolidation, holding). Loi Girardin/Pinel DOM.

### Reste immédiat
- Demander devis **Iopole + b2brouter** (raccordement PDP).
- Exécuter le **démarchage cabinets** (10 cabinets, viser 1-2 RDV).
- Versement auto des commissions de prescription (encore manuel).
- Lancer la **campagne Meta** (pixel + landing dédiée).

---

## 11. Objectif business

Cible **300 clients fin 2026 → ~9 000 €/mois MRR**. Forteresse défensive (concurrents ~2 ans pour répliquer octroi de mer / TVA Guyane). Combiné avec EduKaraib pour sécuriser 2k€/mois. Vision Joseph : 1M€ avant 30 ans, base US (Atlanta) puis réinvestissement marchés caribéen/africain.
