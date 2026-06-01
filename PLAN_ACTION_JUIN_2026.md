# PLAN D'ACTION FacturPeyi — Juin 2026

> Créé le **01/06/2026**. Contexte débloqué : **SIRET validé (105141038)** + **Stripe réglé**.
> Le verrou technique qui justifiait l'arrêt est levé → reprise full force.
> Objectif business immédiat : **générer du cash pour apurer la dette CROUS de 700 € (juillet)**.

---

## 🎯 Priorité absolue — Lifetime Deal "Pionnier DOM-TOM" 199 €

**Pourquoi c'est #1 :** c'est le levier cash le plus direct. 4 ventes = 796 € = dette CROUS couverte.
10 places = 1 990 € encaissés + 10 ambassadeurs lock-in + 10 témoignages clients pour le marketing.

### Ce que le code fait déjà (vérifié 01/06)
- `api/stripe-checkout.js` → **`mode: "subscription"` UNIQUEMENT**, whitelist `ALLOWED_PRICE_IDS` (Solo/Pro/Expert).
- `src/pages/Forfaits.jsx` → array `plans` (4 plans) + `handleStripeCheckout(priceId, planId)`.
- `api/webhook-stripe.js` → traite déjà les events abonnement (à étendre pour le one-time).
- Essai gratuit bypass Stripe fonctionne (`handleTrial`).

### Ce qu'il faut coder (effort ~3-4h)

1. **Stripe Dashboard** — créer un produit "Pionnier DOM-TOM" avec un **price one-time 199 €** (mode paiement unique, pas récurrent). Récupérer le `price_id`.

2. **`api/stripe-checkout.js`** — gérer le mode paiement :
   - Ajouter le nouveau `price_id` dans `ALLOWED_PRICE_IDS`.
   - Si `planId === "pionnier"` → `mode: "payment"` au lieu de `"subscription"`.
   - Garder `metadata: { planId: "pionnier", uid }` pour que le webhook reconnaisse l'achat.

3. **`api/webhook-stripe.js`** — sur `checkout.session.completed` avec `planId === "pionnier"` :
   - Écrire `lifetime: true` + `plan: "solo"` + `lifetimeDate: serverTimestamp()` dans `entreprises/{entrepriseId}`.
   - Incrémenter le compteur `pionniers/_meta { count }` (transaction Firestore, cap à 10).

4. **`src/pages/Forfaits.jsx`** — ajouter un 5e plan "Pionnier" (ou un bandeau dédié au-dessus de la grille) :
   - Prix 199 € « une seule fois », features = « tout Solo, à vie ».
   - Badge urgence « X/10 places restantes » (lecture `pionniers/_meta`).
   - `handlePlanClick` → si `plan.id === "pionnier"`, appeler `handleStripeCheckout(PIONNIER_PRICE_ID, "pionnier")`.

5. **Landing dédiée `/pionnier`** (optionnel mais recommandé pour la conversion) :
   - Nouvelle page + route dans `App.jsx` (cf règle CLAUDE.md : câbler la route + `npm run build` + test).
   - Argumentaire urgence + preuve produit + CTA unique.

6. **Gating** — vérifier que le flag `lifetime: true` est respecté par `PlanGate.jsx` (accès Solo permanent, pas de relance paiement).

7. **Email Resend** — confirmation d'achat + accès immédiat (réutiliser `src/lib/email.js`).

### Checklist livraison (règle CLAUDE.md du repo)
- [ ] Route `/pionnier` câblée dans `App.jsx`
- [ ] `npm run build` sans erreur
- [ ] `npm run dev` → flux d'achat testé bout en bout (Stripe test mode)
- [ ] Webhook testé (paiement → flag `lifetime` posé en BD)
- [ ] Compteur 10 places fonctionne et bloque à 0

### Risque
Si livraison impossible (faillite/bug majeur) → remboursement. Produit existe et tourne → risque faible. **Cap à 10 ventes** pour limiter l'exposition.

---

## 🔥 Action parallèle (0 dev) — Convertir le lead Élie

**DOUGLAS Élie / ÉLICONIA (Guyane)** — premier inscrit organique. Trial gratuit qui **expire le 13/06/2026** → fenêtre qui se referme dans 12 jours.

- Statut : mail envoyé le 18/05, **en attente de réponse**.
- **Action : relance courte** (si toujours pas de réponse) — proposer le call de prise en main 15 min.
- Check-in feedback prévu ~03/06, pitch conversion Solo 19,99 € ~10/06 (maintenant possible, SIRET OK).
- ⚠️ Éclaircir l'incohérence "SAS" dans l'email vs régime micro-BIC (mauvaise config à corriger pendant le call).

---

## 📈 Après le Lifetime Deal — leviers de croissance (ranked)

| # | Levier | Effort | Cash potentiel |
|---|---|---|---|
| M2 | Plans annuels -30 % (Solo 167€/Pro 294€/Expert 462€) | 1-2h dev | 5 annuels Solo = 835€ upfront + churn ↓↓ |
| M3 | Démarchage 10 cabinets experts-comptables DOM | 8-10h, 0 dev | 1 cabinet = 5-20 clients = 100-400€/mois récurrent |
| M5 | Pages SEO 5 territoires (`/logiciel-facturation-guyane`...) | 20h dev | compound 6-12 mois, 5-25 trials/mois |
| M4 | Free tool « Calculateur TVA DOM-TOM » (lead magnet) | 6-8h dev | 50-200 leads/mois, 2-5% conversion |

> Note Sprint 4 : Cabinet / Parrainage / ImportBancaire / TerritoirePage **existent déjà en code** (à vérifier/finaliser, pas à recréer).

---

## 🚨 Levier marketing GRATUIT immédiat — Réforme facture électronique 2026

Obligation B2B FR : sept 2026 → sept 2027. **Argument commercial à activer dès maintenant** : positionner FacturPeyi comme « prêt pour la réforme 2026 » dans la landing + démarchage cabinets. Ça crée de l'urgence d'adoption sans coder quoi que ce soit.

---

## Séquençage recommandé

1. **Lifetime Deal** = chantier dev de la semaine (½ journée bloc).
2. **Relance Élie** = 2 min, à faire aujourd'hui/demain.
3. **M2 (annuel)** = enchaîner juste après, même surface Stripe.
4. **M3 (cabinets)** = lancer en parallèle (0 dépendance code).
5. SEO / free tool = sprint dédié quand bandwidth.

---

*Toute feature livrée → mettre à jour ce fichier + `memory/project_facturepeyi.md` + commit/push (règle globale Joseph).*
