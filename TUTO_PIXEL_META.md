# TUTO — Installer le Pixel Meta sur FacturPeyi

> Objectif : mesurer les conversions des pubs Meta (Facebook/Instagram) — essais gratuits (trials) + achats (abo / Pionnier 199€).
> Sans pixel, impossible de savoir combien coûte un inscrit ou une vente → tu pilotes à l'aveugle.
> Stack : React 19 + Vite, déploiement Vercel. `index.html` à la racine, routing dans `src/App.jsx`.

---

## Étape 0 — Récupérer ton Pixel ID (Meta)

1. **business.facebook.com** → **Gestionnaire d'événements** (Events Manager).
2. **Connecter des sources de données** → **Web** → **Pixel Meta** → Continuer.
3. Nomme-le `FacturPeyi` → tu obtiens un **ID de pixel** (15-16 chiffres). Note-le.
4. (Recommandé) Active **les correspondances avancées automatiques**.

Remplace `TON_PIXEL_ID` partout ci-dessous.

> ⚠️ Pixel DIFFÉRENT de celui d'EduKaraib. Un pixel par site/domaine.

---

## Étape 1 — Code de base dans `index.html`

Ouvre `index.html` (racine) et colle juste avant `</head>` :

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'TON_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=TON_PIXEL_ID&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->
```

Ça envoie un `PageView` au chargement initial. FacturPeyi étant une **SPA** (React Router 7), il faut suivre les changements de route (étape 2).

---

## Étape 2 — PageView sur changement de route (SPA)

Contrairement à EduKaraib, FacturPeyi **n'a pas encore de tracker**. On crée un petit composant.

Crée `src/components/PixelTracker.jsx` :

```jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PixelTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search]);
  return null;
}
```

Puis dans `src/App.jsx`, monte-le **à l'intérieur du `<BrowserRouter>`** (sinon `useLocation` plante), au-dessus des `<Routes>` :

```jsx
import PixelTracker from "./components/PixelTracker";
// ...
<BrowserRouter>
  <PixelTracker />
  <Routes>
    {/* ... */}
  </Routes>
</BrowserRouter>
```

---

## Étape 3 — Événement ESSAI GRATUIT (`CompleteRegistration`)

L'inscription / trial se finalise dans `src/pages/Inscription.jsx` (le formulaire 2 étapes crée `users/{uid}` + `entreprises/{id}`).

Repère l'endroit où la création de l'entreprise réussit (après le `setDoc`/`addDoc` de l'entreprise, dans le cas `trialOk`). Ajoute :

```js
if (typeof window !== "undefined" && typeof window.fbq === "function") {
  window.fbq("track", "CompleteRegistration", { content_name: "trial" });
}
```

> C'est l'event que Meta utilisera pour optimiser la pub froide (« trouve-moi des gens qui démarrent un essai »).

---

## Étape 4 — Événement ACHAT (`Purchase`) avec le montant

Le paiement Stripe redirige vers **`/paiement/success`** → `src/pages/PaiementSuccess.jsx`.

Dans `PaiementSuccess.jsx`, déclenche `Purchase` **une seule fois** au montage (la page n'est atteinte que si le paiement a réussi) :

```js
import { useEffect, useRef } from "react";
// ...
const fired = useRef(false);
useEffect(() => {
  if (!fired.current && typeof window !== "undefined" && window.fbq) {
    fired.current = true;
    // Récupère le plan/montant depuis l'état de navigation ou le session_id.
    // Si tu connais le montant côté front, passe-le ; sinon mets une valeur par plan.
    const value = 199; // Pionnier ; pour les abos, mappe le plan → prix
    window.fbq("track", "Purchase", { value, currency: "EUR" });
  }
}, []);
```

> **Plus propre :** crée un endpoint type `/api/stripe-session-status` (comme EduKaraib) qui renvoie `amount_total` à partir du `session_id` présent dans l'URL, et passe ce montant réel à `value`. Sinon, une table de correspondance plan → prix suffit pour démarrer.

---

## Étape 5 — Vérifier que ça marche

1. Extension Chrome **Meta Pixel Helper**.
2. `npm run dev` → navigue : `PageView` à chaque page.
3. Crée un essai test → `CompleteRegistration`.
4. Paiement test (Stripe test mode) → `Purchase` avec `value`.
5. Events Manager → **Tester les événements** : remontée en direct.

---

## Étape 6 (RGPD) — Consentement

Pixel = cookies → bandeau de consentement CNIL requis avant de scaler. Pour un test rapide tu peux lancer, mais régularise (CMP type Axeptio/tarteaucitron, ou init du pixel après acceptation) avant de monter le budget.

---

## (Optionnel, plus tard) — Conversions API server-side

Tu as déjà `api/webhook-stripe.js` qui traite `checkout.session.completed`. Pour fiabiliser le `Purchase` (adblockers + iOS), envoie le même achat à l'**API de Conversions Meta** depuis ce webhook, avec un `event_id` partagé avec le pixel client (déduplication). À faire quand le budget pub le justifie.

---

## Récap des événements posés

| Événement | Où | Quand |
|---|---|---|
| `PageView` | index.html + PixelTracker | chargement + chaque navigation |
| `CompleteRegistration` | Inscription.jsx (cas trialOk) | essai gratuit créé |
| `Purchase` | PaiementSuccess.jsx | paiement Stripe confirmé (abo ou Pionnier) |
