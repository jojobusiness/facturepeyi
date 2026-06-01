# TUTO — Créer les produits Stripe (Pionnier + Annuels)

> Objectif : créer **4 prix** dans Stripe et me redonner leurs 4 IDs.
> Le code est déjà écrit avec des placeholders `price_REMPLACER_...` — il suffit de les remplacer.

---

## ⚠️ Avant de commencer

1. Connecte-toi sur **https://dashboard.stripe.com**
2. Vérifie en haut à droite que tu es en mode **« Production / Live »** (pas « Test »), sinon les IDs ne marcheront pas sur le vrai site. Le toggle est en haut à droite.
3. Toujours créer le prix **en euros (EUR)**.

Un **price_id** ressemble à `price_1ABcdEFghIJklMNop`. C'est lui qu'il me faut, **pas** le `prod_...` (ça c'est le produit).

---

## 1. Produit « Pionnier DOM-TOM » — paiement unique 199 €

C'est l'offre à vie. **Paiement unique**, surtout pas récurrent.

1. Menu **Produits** (Product catalog) → **+ Ajouter un produit**.
2. **Nom** : `Pionnier DOM-TOM — Accès Solo à vie`
3. **Description** (optionnel) : `Accès Solo à vie, paiement unique. 10 places.`
4. Section **Tarif** :
   - **Modèle de tarification** : `Forfaitaire` (standard)
   - **Prix** : `199,00` EUR
   - **⚠️ Type de paiement : `Unique` (One-time)** — PAS « Récurrent ». C'est le point critique.
5. **Enregistrer le produit**.
6. Clique sur le prix créé → copie son **API ID** (`price_...`).

➡️ **À me redonner : `PIONNIER_PRICE_ID`**

---

## 2. Solo annuel — 199 €/an (récurrent)

1. **Produits** → tu peux soit créer un nouveau produit `Solo (annuel)`, soit ajouter un prix au produit Solo existant. Le plus simple : **ouvrir le produit Solo existant** → **+ Ajouter un autre tarif**.
2. **Prix** : `199,00` EUR
3. **Type de paiement : `Récurrent`**
4. **Période de facturation : `Annuel` (Yearly)**
5. Enregistrer → copier le **API ID** du nouveau prix.

➡️ **À me redonner : `SOLO_ANNUAL_PRICE_ID`**

---

## 3. Pro annuel — 349 €/an (récurrent)

Même méthode, sur le produit **Pro** existant → + Ajouter un tarif :
- **Prix** : `349,00` EUR · **Récurrent** · **Annuel**

➡️ **À me redonner : `PRO_ANNUAL_PRICE_ID`**

---

## 4. Expert annuel — 549 €/an (récurrent)

Sur le produit **Expert** existant → + Ajouter un tarif :
- **Prix** : `549,00` EUR · **Récurrent** · **Annuel**

➡️ **À me redonner : `EXPERT_ANNUAL_PRICE_ID`**

---

## Récapitulatif — ce que tu me renvoies

Copie-colle simplement ce bloc rempli :

```
PIONNIER_PRICE_ID      = price_...
SOLO_ANNUAL_PRICE_ID   = price_...
PRO_ANNUAL_PRICE_ID    = price_...
EXPERT_ANNUAL_PRICE_ID = price_...
```

Dès que je les ai, je remplace les 3 fichiers concernés
(`api/stripe-checkout.js`, `lib-server/stripe-plans.js`, `src/pages/Forfaits.jsx`),
je rebuild, et on commit/push. Le tarif mensuel continue de tourner pendant ce temps.

---

## Rappels (prix actuels mensuels, déjà en prod)

| Plan | Mensuel (live) | Annuel à créer (2 mois offerts) |
|---|---|---|
| Solo | 19,99 €/mois | **199 €/an** |
| Pro | 34,99 €/mois | **349 €/an** |
| Expert | 54,99 €/mois | **549 €/an** |
| Pionnier | — | **199 € une seule fois (à vie)** |

---

## Note technique — pas besoin de toucher au webhook Stripe

Le webhook existant (`api/webhook-stripe.js`) gère déjà :
- les abonnements annuels (même logique que le mensuel, le mapping prix→plan est dans `lib-server/stripe-plans.js`) ;
- le paiement unique Pionnier (nouvelle branche `planId === "pionnier"` → pose `lifetime: true` + `plan: solo` + `planStatus: active`).

Le seul endpoint Stripe à vérifier côté Dashboard, c'est que ton **webhook écoute bien l'événement `checkout.session.completed`** (il devrait déjà, vu qu'il sert aux paiements de factures). Si ce n'est pas le cas : **Développeurs → Webhooks → ton endpoint → ajouter l'événement `checkout.session.completed`**.
```
