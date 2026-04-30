# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vision & Feuille de Route

Lire `AMELIORATIONS.md` en priorité — c'est le document de vision qui guide tout le développement.
Plan de sprint actif : voir section "Plan de développement" ci-dessous.

## Commandes

```bash
npm run dev       # Serveur de développement local (Vite HMR)
npm run build     # Build de production
npm run preview   # Prévisualiser le build de production
npm run lint      # ESLint sur tout le projet
```

Les fonctions serverless (`/api/*.js`) s'exécutent via Vercel en production. En local, utiliser `vercel dev` pour les tester (nécessite Vercel CLI).

## Règle obligatoire — Test des pages et vérification des routes

**Après avoir créé ou modifié une page, TOUJOURS :**

1. **Vérifier que la route est câblée dans `App.jsx`** — une page non enregistrée est invisible.
2. **Lancer `npm run build`** — confirme qu'il n'y a pas d'erreur de compilation.
3. **Démarrer `npm run dev`** et tester la route manuellement (`curl` ou navigateur) — s'assurer que la page se charge sans erreur 404 ni crash React.
4. **Vérifier les imports** — tous les composants, hooks et librairies utilisés doivent être importés en haut du fichier.
5. Pour les pages avec `useParams` ou `useLocation`, vérifier que le slug/param correspond exactement à la route déclarée dans `App.jsx`.

Ne jamais considérer une page comme livrée sans avoir vérifié ces 5 points.

## Architecture

### Stack
- **Frontend :** React 19 + Vite + Tailwind CSS 3 — police **Inter** (Google Fonts)
- **Routing :** React Router DOM 7 (SPA, toutes les routes redirigées via `vercel.json`)
- **Backend :** Firebase (Auth + Firestore + Storage) + fonctions serverless Vercel (`/api/`)
- **Paiements :** Stripe (abonnements) via `/api/stripe-checkout.js`
- **Déploiement :** Vercel (primaire)

### Structure des données Firestore

```
utilisateurs/{uid}
  email, nom, role, entrepriseId, uid, createdAt

entreprises/{entrepriseId}
  nom             → nom de l'entreprise
  ownerUid        → UID du créateur (admin)
  territoire      → clé territoire (ex: "guyane", "martinique") — voir src/lib/territories.js
  tvaRate         → taux TVA en % (ex: 0, 8.5, 20) — calculé auto depuis territoire + régime
  mentionLegale   → mention légale à afficher sur les factures (ex: "TVA non applicable - article 294 du CGI")
  regime          → "auto-entrepreneur" | "micro-bic" | "micro-bnc" | "reel"
  octroiDeMer     → boolean — true si territoire soumis à l'Octroi de mer
  createdAt       → serverTimestamp()

  /factures/{facId}
    clientId, clientNom, clientEmail, description
    amountHT, tva, totalTTC, tvaRate, mentionLegale
    date (Timestamp), status ("en attente" | "payée" | "en retard")
    createdAt, entrepriseId

  /clients/{clientId}
    nom, email, telephone, adresse

  /depenses/{depenseId}
    fournisseur, montantHT, TVA, categorieId, date

  /categories/{catId}
    nom, icone, couleur

  /comptes/{compteId}
    plan comptable, éléments liés

  /membres/{uid}
    uid, nom, email, role ("admin"|"comptable"|"employe"), dateAjout, entrepriseId
```

### AuthContext — données exposées

`AuthContext` (`src/context/AuthContext.jsx`) expose via `useAuth()` :
```js
const { user, entreprise, entrepriseId, loading, refreshEntreprise } = useAuth();
```
- `entreprise` : document Firestore complet de l'entreprise (territoire, tvaRate, mentionLegale, etc.)
- `entrepriseId` : ID Firestore de l'entreprise
- `refreshEntreprise()` : recharge le doc entreprise (appeler après modification dans Settings)

Ne plus faire `getDoc(doc(db, "utilisateurs", uid))` dans chaque page pour récupérer `entrepriseId` — utiliser `useAuth()`.

### Authentification & Autorisation

Deux guards dans `src/components/` :
- `PrivateRoute` → redirige vers `/login` si non authentifié
- `RoleRoute` → redirige vers `/unauthorized` si rôle insuffisant

Rôles : `admin` > `comptable` > `employe`. Les routes de comptabilité sont restreintes à `comptable` et `admin`.

### Flux d'inscription
```
/Forfaits → (Stripe checkout OU essai gratuit) → /Inscription?state={paymentOk|trialOk}
  → formulaire 2 étapes (compte + entreprise + territoire)
  → crée users/{uid} + entreprises/{id} + membres/{uid}
  → /dashboard
```

### Layout Dashboard
`DashboardLayout` (`src/layouts/DashboardLayout.jsx`) — sidebar fixe desktop, overlay mobile.

## Spécificités DOM-TOM — Règles critiques

**Fichier de référence : `src/lib/territories.js`**

```js
import { getTvaRate, getMentionLegale, hasOctroiDeMer, TERRITORIES } from "../lib/territories";
```

| Territoire | tvaRate | Octroi de mer | Mention légale |
|---|---|---|---|
| Martinique / Guadeloupe / Réunion / Saint-Martin | 8,5% | ✅ | — |
| Guyane / Mayotte / Saint-Barthélemy / Saint-Pierre | 0% | ❌ | "TVA non applicable - article 294 du CGI" |
| Nouvelle-Calédonie | 11% (TGC) | ❌ | "TGC - 11%" |
| Polynésie française | 16% | ❌ | — |
| Wallis-et-Futuna | 0% | ❌ | "TVA non applicable" |
| Auto-entrepreneur (tout territoire) | 0% | — | "TVA non applicable, art. 293 B du CGI" |
| France métropolitaine | 20% | ❌ | — |

**Règle auto-entrepreneur : override toujours la mention territoriale.**

## Patterns importants

- **Calcul TVA :** `montantHT * (tvaRate / 100)` → `montantTVA`, puis `montantHT + montantTVA` → `totalTTC`
- **tvaRate et mentionLegale :** toujours lus depuis `entreprise.tvaRate` / `entreprise.mentionLegale` via `useAuth()` — ne jamais hardcoder
- **Logo PDF :** converti en base64 avant injection dans les PDFs (`src/utils/downloadPDF.jsx`)
- **Export ZIP :** `JSZip` + `FileSaver` pour les rapports groupés (`/dashboard/rapports`)
- **Import dépenses :** `PapaParse` parse les CSV uploadés (`ImportDepenses.jsx`)
- **Timestamps Firestore :** toujours `serverTimestamp()`, jamais `new Date()`

## Variables d'environnement (Vercel)

```
STRIPE_SECRET_KEY          # Clé secrète Stripe (backend uniquement)
NEXT_PUBLIC_SITE_URL       # URL de production (ex: https://facturepeyi.com)
```

La config Firebase est publique dans `src/lib/firebase.js` (normal pour Firebase Web SDK).

## Pages publiques

| Route | Fichier | Description |
|---|---|---|
| `/` | `Home.jsx` | Landing page (hero split-layout, fonctionnalités, territoires, tarifs, FAQ) |
| `/Forfaits` | `Forfaits.jsx` | 4 plans : Découverte (gratuit), Solo, Pro, Expert |
| `/Inscription` | `Inscription.jsx` | Formulaire 2 étapes : compte + entreprise + territoire |
| `/login` | `Login.jsx` | Connexion Firebase |
| `/support` | `Support.jsx` | FAQ catégorisée DOM-TOM + formulaire contact amélioré |
| `/conditions` | `Conditions.jsx` | CGU |
| `/confidentialite` | `Confidentialite.jsx` | Politique de confidentialité |

## Plan de Développement — Sprints actifs

### ✅ Sprint 0 — Fait
- Firestore rules sécurisées (auth + rôles)
- Bug Inscription.jsx corrigé
- Landing page refondue (hero split-layout, floating cards)
- Forfaits.jsx — 4 plans
- Police Inter sur tout le site
- Page /support
- src/lib/territories.js — config fiscale complète 12 territoires
- AuthContext étendu (entreprise, entrepriseId, refreshEntreprise)
- Inscription.jsx — formulaire 2 étapes + sélecteur territoire
- CreateInvoice.jsx — tvaRate pré-rempli depuis entreprise
- InvoicePDF.jsx — mentionLegale + design refait

### ✅ Sprint 1 — Terminé
- [x] Dashboard KPIs (CA, factures impayées, taux recouvrement)
- [x] Widget factures en retard
- [x] Emails transactionnels via Resend (`/api/send-email.js` + `src/lib/email.js`) — nécessite `RESEND_API_KEY` dans Vercel env vars
- [x] Onboarding guidé (checklist 5 étapes) — `src/components/OnboardingChecklist.jsx`

### ✅ Sprint 2 — Terminé
- [x] Module Devis + conversion en facture
- [x] Rappels de paiement automatiques (J+7, J+15, J+30) — `/api/send-reminders.js` + cron Vercel
- [x] Navigation restructurée (Ventes / Achats / Comptabilité) — DashboardLayout.jsx refondu
- [x] Env vars Vercel configurées : `FIREBASE_SERVICE_ACCOUNT_JSON` + `CRON_SECRET`

### ✅ Sprint 3 — DOM-TOM avancé — Terminé
- [x] Octroi de mer dans dépenses + déclaration fiscale
- [x] Régimes fiscaux avancés dans Settings (territoire + régime + aperçu temps réel)
- [x] Calendrier fiscal avec rappels (J−14 rouge, J−30 orange, par régime)
- [x] PWA mobile (manifest.json + meta tags Apple)

### Sprint 4 — Scale
- [ ] Plan Cabinet (multi-entreprises, experts-comptables)
- [ ] Programme de parrainage
- [ ] Import bancaire CSV/OFX
- [ ] Pages SEO par territoire (/martinique, /guadeloupe, etc.)
- [ ] Gestion SCIs + holding (Phase 3-4, voir mémoire projet)
