# PLAN — Pubs Meta FacturPeyi + Landing froide dédiée

> Créé le 13/06/2026. Validé par Joseph (angles : réforme 2026 **+** fiscalité DOM-TOM ; landing dédiée à coder).
> Budget : géré avec Théo, étalé sur plusieurs jours — démarrer petit, monter **uniquement sur signal**.
> Prérequis bloquant : pixel Meta posé + vérifié (voir `TUTO_PIXEL_META.md`).

---

# PARTIE A — Stratégie de campagne

## Objectif du test
**Mesurer le coût d'un essai gratuit (CPL trial) sur le marché DOM-TOM.** On ne vise PAS la vente directe au premier contact : un cold prospect ne lâche pas 199€ (ni un abo) sur une marque découverte il y a 30s. On cherche d'abord : *combien coûte un entrepreneur qui démarre un essai ?* La vente (Pionnier / abo) se joue ensuite, en retargeting, sur les gens déjà entrés.

## Prérequis avant de dépenser
1. **Pixel posé + vérifié** dans Events Manager → Test Events (events `PageView`, `CompleteRegistration`, `Purchase`).
2. **Landing froide dédiée en ligne** (Partie B) — pas `/Forfaits` qui éparpille sur 5 plans.
3. Compte Meta Business + moyen de paiement actif.

## Structure — 2 campagnes séquentielles

### Campagne 1 — FROIDE (à lancer en premier)
- **Objectif Meta** : Conversions → optimisé sur `CompleteRegistration` (essai gratuit).
- **Destination** : la landing dédiée (Partie B).
- **2 angles créa en parallèle** (validé) :
  - **Angle A — Réforme 2026** (urgence légale) : « La facturation électronique devient obligatoire. Ton outil est-il prêt ? »
  - **Angle B — Fiscalité DOM-TOM** (anti-concurrence métropole) : « TVA 8,5% / 0% Guyane / octroi de mer : les logiciels métropole se trompent. »
- On laisse les deux tourner, Meta arbitre. On garde le gagnant.

### Campagne 2 — RETARGETING (semaine 2, quand il y a du trafic à recibler)
- **Objectif Meta** : Conversions → `Purchase`.
- **Audience** : visiteurs site 30j + `CompleteRegistration` **sans** `Purchase`.
- **Créa** : Pionnier 199€ rareté — « Tu as testé ? Deviens Pionnier : accès à vie, 199€ une fois, jamais d'abonnement. 10 places. »

## Audiences
- **Froide** : géo Guyane + Martinique + Guadeloupe + Réunion ; 25-55 ans ; intérêts auto-entrepreneur / TPE / artisan / comptabilité. Large — on laisse l'algo trouver (advantage+ OK).
- **Retarget** : audiences personnalisées « visiteurs site 30j » + « CompleteRegistration sans achat ».

## Discipline (la leçon de la campagne influ EduKarib)
- **Démarrer petit**, monter le budget **seulement** si le CPL trial est sain.
- **Kill une créa** qui ne produit aucun essai après une fenêtre de dépense significative (≈ ce que coûterait normalement 1-2 trials). Pas d'acharnement.
- **Lecture rentabilité** : CPL trial à comparer à la valeur d'un client. Repères produit :
  - Pionnier = **199€ one-shot** · Solo = **19,99€/mois** (récurrent).
  - Si une fraction raisonnable des trials convertit, un CPL bas se rembourse vite (surtout avec le récurrent).
- **Métrique nord** : coût par essai, puis taux essai → payant. Pas les likes/vues.

## Timeline
1. **J0-J1** : pixel vérifié + landing en ligne + compte pub prêt.
2. **J2 → plusieurs jours** : campagne froide (2 angles), lecture du CPL trial.
3. **Dès qu'il y a du trafic** : activer le retargeting Pionnier.
4. **Lecture** : garder la créa/angle gagnant, couper le reste, décider du scale avec Théo.

---

# PARTIE B — Landing froide dédiée (à coder)

## Pourquoi une page dédiée
La pub froide doit tomber sur **une promesse unique + un seul CTA**, pas sur la grille `/Forfaits`. Bonus : la page sert aussi d'**actif SEO** (« facturation électronique 2026 », « logiciel facturation DOM-TOM » = gros volume de recherche). Double usage pub + organique.

## Route & fichier
- **Nouveau fichier** : `src/pages/FacturationElectronique2026.jsx`
- **Route** dans `src/App.jsx` (zone routes publiques, à côté des pages territoires) :
  ```jsx
  import FacturationElectronique2026 from "./pages/FacturationElectronique2026";
  // ...
  <Route path="/facturation-electronique-2026" element={<FacturationElectronique2026 />} />
  ```
- Slug choisi pour le SEO. (Option : alias `/essai-gratuit` pointant sur le même composant.)

## CTA — où il envoie (vérifié dans le code)
Le flux essai gratuit attend un state. Reproduire exactement le pattern de `Forfaits.jsx` (`handleTrial`) :
```js
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
const startTrial = () => {
  // Optionnel : event funnel pour voir clic → trial
  if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead");
  navigate("/Inscription", { state: { trialOk: true } });
};
```
> ⚠️ `Inscription.jsx` redirige si `state.trialOk` (ou `paymentOk`) est absent → toujours passer `{ trialOk: true }`. Ne PAS faire un simple `<Link to="/Inscription">` (la page rejettera).

## Sections de la page (ordre)

1. **HERO — les deux angles d'un coup**
   - H1 (réforme, urgence) : *« La facture électronique devient obligatoire. FacturPeyi est déjà prêt. »*
   - Sous-titre (DOM-TOM) : *« Le logiciel de facturation conçu pour la Guyane, les Antilles et la Réunion — TVA et mentions légales automatiques selon ton territoire. »*
   - CTA principal : **« Démarrer mon essai gratuit »** (→ `startTrial`)
   - Micro-réassurance sous le bouton : *« 5 factures gratuites · sans carte bancaire »*

2. **BANDEAU URGENCE RÉFORME 2026**
   - Explique en 2 lignes : la réforme rend la facturation électronique (Factur-X) obligatoire entre les entreprises. FacturPeyi génère déjà des factures **Factur-X conformes** (XML embarqué, PDF/A-3). « Sois prêt avant l'échéance, pas dans la panique. »

3. **BLOC DOM-TOM (le wedge anti-concurrence)**
   - 3-4 cartes / icônes :
     - **TVA automatique par territoire** : 8,5% Antilles-Réunion, 0% Guyane (art. 294)…
     - **Octroi de mer** géré dans les dépenses et la déclaration.
     - **Mentions légales auto** (art. 294 / art. 293 B auto-entrepreneur).
     - « Les logiciels métropole se trompent là-dessus. Pas FacturPeyi. »
   - Source de vérité : `src/lib/territories.js` (ne pas réinventer les taux, les citer).

4. **FONCTIONNALITÉS CLÉS (preuve produit)**
   - Factures & devis conformes · Relances de paiement auto (J+7/J+15/J+30) · Déclaration fiscale + calendrier · Tableau de bord CA/impayés. (Tout existe déjà — cf `AMELIORATIONS.md` / sprints.)

5. **RÉASSURANCE**
   - Gratuit pour démarrer (5 factures) · Données hébergées en sécurité · Aucune carte requise pour l'essai.

6. **FAQ courte (3-4 questions)**
   - « La facturation électronique est-elle vraiment obligatoire ? » · « C'est quoi Factur-X ? » · « C'est adapté à mon régime (auto-entrepreneur / micro-BIC) ? » · « C'est gratuit ? »

7. **CTA FINAL** répété + **barre CTA collante mobile** (même principe que la landing /bac EduKarib — récupère ceux qui scrollent sans cliquer) :
   ```jsx
   <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t p-3 shadow-lg">
     <button onClick={startTrial} className="w-full bg-[couleur-primaire] text-white font-bold py-3 rounded-xl">
       Démarrer mon essai gratuit
     </button>
   </div>
   <div className="md:hidden h-20" />
   ```

## SEO (double usage)
- Ajouter `title` + `meta description` selon le pattern déjà en place (regarder comment `Home.jsx` / `TerritoirePage.jsx` gèrent le `<head>`).
  - Title : *« Facturation électronique 2026 + logiciel DOM-TOM | FacturPeyi »*
  - Description : axée réforme 2026 + TVA DOM-TOM + essai gratuit.
- Lier la page dans le footer / sitemap (page publique → règle CLAUDE.md du repo).

## Pixel (déjà branché par le tuto)
- `PageView` part tout seul (PixelTracker).
- `Lead` au clic CTA (ci-dessus) → permet de voir le drop clic → essai.
- `CompleteRegistration` se déclenche dans `Inscription.jsx` quand l'essai est créé (tuto).

## Checklist de livraison (règle CLAUDE.md du repo — obligatoire)
- [x] Route `/facturation-electronique-2026` (+ alias `/essai-gratuit`) câblée dans `App.jsx`
- [x] Imports tous présents en haut du fichier
- [x] `npm run build` sans erreur (vérifié 13/06/2026)
- [~] `npm run dev` → **non testé en navigateur** : lock OneDrive `EPERM` sur `node_modules/.vite/deps` empêche le dev server de démarrer. Build prod vert = compilation OK. À refaire après `npm install` propre hors OneDrive ou suppression du cache `.vite`.
- [x] CTA → `navigate("/Inscription", { state: { trialOk: true, ref } })` (pattern vérifié dans Forfaits.jsx + garde Inscription.jsx)
- [ ] Testé **sur mobile** (à faire en preview Vercel après déploiement)
- [x] Lien ajouté au footer Home + sitemap.xml
- [ ] `Lead` visible dans Meta Pixel Helper au clic CTA → **bloqué tant que `TON_PIXEL_ID` pas remplacé** (Théo)

## ✅ Livré 13/06/2026 — code pixel + landing (en attente Pixel ID Théo)
- `index.html` : code pixel de base + PageView (placeholder `TON_PIXEL_ID`, fallback noscript retiré car interdit dans `<head>` et inutile pour une SPA).
- `src/components/PixelTracker.jsx` : PageView sur changement de route (monté dans App.jsx).
- `src/pages/Inscription.jsx` : `CompleteRegistration` { content_name: "trial" } quand l'essai est créé (cas non-payant).
- `api/get-session-info.js` : renvoie `amountTotal` + `currency` (montant réel Stripe).
- `src/pages/PaiementSuccess.jsx` : `Purchase` avec **montant réel** (jamais hardcodé 199€), tiré une seule fois (`useRef`).
- `src/pages/FacturationElectronique2026.jsx` : landing complète. Hero adaptatif `?angle=reforme|domtom` (chaque créa pointe sur SA promesse), capture `?ref=` (préserve la prescription 25%), `Lead` au clic CTA, barre CTA collante mobile, FAQ JSON-LD, SEO Helmet.
- **Correction vs tuto d'origine** : Purchase = montant réel via endpoint existant `get-session-info` (pas de hardcode), et `ref` transmis depuis la landing.
- **Reste avant de dépenser** : (1) ✅ Pixel ID `902547262470626` posé (14/06) ; (2) ✅ CMP/consentement CNIL livré (14/06, voir ci-dessous) ; (3) Théo → vérifier pixel dans Test Events + domaine Meta vérifié + moyen de paiement actif.

## DÉCISION 14/06/2026 — bandeau consentement RETIRÉ (tracking par défaut)
Joseph (décision business assumée) : la campagne a besoin d'un max de data, un bandeau ferait dire « non » à beaucoup → bandeau supprimé, **le pixel tracke tout le monde par défaut**.
- Refusé / non implémenté : un bouton « Refuser » qui tracke quand même (= dark pattern exactement ciblé par les sanctions CNIL Google 150M€ / Facebook 60M€, et fabrique la preuve de mauvaise foi). « Pas de bouton » est moins risqué que « faux bouton ».
- `src/lib/pixel.js` : simplifié → `loadPixel()` seul (idempotent), chargé au démarrage.
- `PixelTracker.jsx` : 1er run → `loadPixel()` (PageView initial), puis PageView par route.
- `ConsentBanner.jsx` : **supprimé** (corbeille).
- `src/pages/Cookies.jsx` : mention honnête du pixel Meta + opt-out renvoyé aux réglages navigateur (pas de faux contrôle in-page).
- Build + lint verts.
- ⚠️ Risque résiduel assumé : non conforme strict CNIL pour audience UE. À ce volume, parcours réaliste = mise en demeure avant sanction. Si besoin futur de data robuste sans dépendre du navigateur → **Conversions API server-side** depuis `api/webhook-stripe.js` (Purchase/CompleteRegistration côté serveur, dédup via event_id) = plus de data que n'importe quel bandeau.

---

## Ordre d'exécution recommandé
1. Poser le pixel (tuto) + vérifier dans Test Events.
2. Coder la landing (Partie B) + valider la checklist.
3. Lancer la campagne froide 2 angles (Partie A) avec Théo, petit budget.
4. Activer le retargeting Pionnier dès qu'il y a du trafic.
