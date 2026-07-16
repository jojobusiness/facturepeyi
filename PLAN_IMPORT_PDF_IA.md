# PLAN — Import PDF/photos en vrac analysé par IA (16/07/2026)

## Verdict de faisabilité : ✅ OUI, et c'est un différenciateur majeur

Déposer un vrac de factures (PDF, photos JPG/PNG), un programme les analyse, les **trie**
(facture émise / dépense / devis) et les importe. Aucun concurrent local ne fait ça.
La techno adaptée est un LLM avec entrée document/vision (API Claude) côté serverless —
les regex/OCR classiques sont trop fragiles face à des mises en page hétérogènes.

**Prérequis déjà en place** : imports CSV avec aperçu (le même écran de validation sera réutilisé),
auto-catégorisation (`detectCategorie`), helper auth serverless (`lib-server/auth.js`),
fonctions Vercel (`/api/*`).

---

## Architecture

```
[Client React]                         [Vercel /api]                    [API Claude]
page ImportDocuments                    extract-document.js
  drop N fichiers (PDF/JPG/PNG)   ──►   1. vérif token Firebase    ──►   1 appel / document
  boucle : 1 requête par fichier        2. base64 → content block        modèle : claude-haiku-4-5
  (base64, ~4 Mo max/fichier)           3. structured outputs            sortie : JSON garanti
                                        4. renvoie le JSON               (json_schema strict)
  ◄── aperçu trié (3 onglets :
      factures / dépenses / devis)
  utilisateur valide → écritures Firestore (réutilise la logique des imports CSV)
```

### Pourquoi ce découpage
- **1 appel par document** : reste sous la limite Vercel de 4,5 Mo par requête et
  sous le timeout (configurer `maxDuration: 60` dans la fonction). Le client fait la
  boucle et affiche la progression (« 12/30 analysés... ») — effet vidéo garanti.
- **L'utilisateur valide avant écriture** : même philosophie que les imports CSV.
  L'IA propose, l'humain confirme. Zéro écriture Firestore automatique.
- **Le tri** est fait par le modèle : on lui donne le nom + SIRET de l'entreprise de
  l'utilisateur → si elle est l'émetteur = facture (vente) ; si elle est destinataire =
  dépense (achat) ; si le document dit « devis » = devis.

---

## Le cœur — `/api/extract-document.js`

- SDK : `@anthropic-ai/sdk` (npm). Env var Vercel : `ANTHROPIC_API_KEY` (+ `.trim()` !).
- Entrée PDF : content block `{type: "document", source: {type: "base64", media_type: "application/pdf", data}}`
  — aucun header beta requis. Photos : block `{type: "image", source: {type: "base64", media_type: "image/jpeg", data}}`.
- **Structured outputs** (`output_config.format` avec `json_schema`) → le JSON de sortie est
  garanti conforme au schéma, pas de parsing fragile.

### Schéma JSON de sortie (extraction)
```json
{
  "type_document": "facture_emise | depense | devis | inconnu",
  "numero": "string|null",
  "date": "AAAA-MM-JJ|null",
  "emetteur": "string",
  "destinataire": "string",
  "description": "string",
  "montant_ht": "number|null",
  "taux_tva": "number|null",
  "montant_ttc": "number",
  "statut": "payée|en attente|null",
  "confiance": "haute|moyenne|basse"
}
```
`confiance: basse` → la ligne est surlignée orange dans l'aperçu pour vérification manuelle.

### Choix du modèle — décision à trancher (recommandation incluse)
| Modèle | Prix entrée/sortie par MTok | Coût / document (~2-3 pages) | Quand |
|---|---|---|---|
| **claude-haiku-4-5** (reco) | 1 $ / 5 $ | **~0,3 à 0,8 centime** | Extraction structurée = son terrain. 100 docs ≈ 0,50 € |
| claude-sonnet-5 | 3 $ / 15 $ (intro 2/10 jusqu'au 31/08) | ~1 à 2,5 centimes | Si Haiku se plante sur les photos floues/manuscrites |

**Ma reco tranchée : démarrer Haiku, mesurer le taux d'erreur sur 30 vrais documents, ne monter
sur Sonnet que si nécessaire.** À ces prix, même en offrant la feature au plan Découverte pour
l'acquisition, le coût est négligeable — mais voir « garde-fous » ci-dessous.

### Garde-fous coût/abus (obligatoires avant prod)
1. **Auth Firebase obligatoire** (réutiliser `lib-server/auth.js`) — jamais d'endpoint ouvert.
2. **Quota par plan** : ex. Découverte 10 docs/mois, Solo 100, Pro 500, Expert/Pionnier illimité.
   Compteur Firestore `entreprises/{id}/compteurs/extractions_{AAAA-MM}` (même pattern transactionnel
   que la numérotation).
3. Taille max 4 Mo/fichier côté client + rejet serveur, types MIME whitelist (pdf/jpeg/png/webp).
4. Log du nombre d'appels dans `/sysadmin` (suivi du coût réel).

---

## Phases

### Phase 1 — MVP (1 session de dev)
- `api/extract-document.js` (auth + Claude + structured outputs).
- Page `ImportDocuments.jsx` : drop multi-fichiers → boucle d'appels → aperçu trié en 3 onglets
  (réutilise les composants d'aperçu des imports CSV) → validation → écritures Firestore :
  - facture émise → collection `factures` (numéro d'origine conservé, `imported: true`)
  - dépense → `depenses` + `detectCategorie()` sur émetteur+description
  - devis → `devis`
- Route `/dashboard/import-documents` + carte « Importer des documents (IA) » sur les pages
  Factures/Dépenses/Devis.
- Quota simple + env var + test bout en bout avec 10 PDF réels variés.

### Phase 2 — Confort
- Upload d'un ZIP (dézippé côté client avec JSZip, déjà dans les deps).
- Rattachement automatique au client existant (match sur le nom destinataire ≈ `clients`).
- Détection de doublons (même numéro + même montant déjà en base → warning).

### Phase 3 — Angle réforme 2026
- Archivage du fichier source dans Firebase Storage lié au doc Firestore (= « archivage légal »
  affiché dans FP5). Attention coût Storage : activer seulement à partir du plan Pro.

## Angle vidéo (après Phase 1)
« Tu as un dossier plein de factures en PDF ? Regarde. » → drag & drop de 20 fichiers →
compteur qui monte → tableau trié qui se remplit → « L'IA a tout lu, tout trié, tout importé. »
C'est LA suite logique de FP6, avec un wow supérieur. Même règle : tester le flow réel avant de tourner.

## Ce qui est déjà livré aujourd'hui (16/07)
✅ **Import devis CSV** (`/dashboard/devis/import`, bouton « Importer » sur la liste des devis) —
le trou que tu as signalé est bouché, même pattern que factures/dépenses.
