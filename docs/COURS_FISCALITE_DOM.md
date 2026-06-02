# Cours de fiscalité DOM-TOM — pour comprendre (et vendre) Factur'Peyi

> Objectif : que tu puisses expliquer chaque règle fiscale de l'app sans bafouiller, et tenir un
> échange avec un expert-comptable. Lis-le une fois en entier, garde-le en référence.
> Tout ce qui suit est **exactement ce que Factur'Peyi automatise** — donc c'est ta différenciation.

---

## 0. La carte mentale en 30 secondes

Une facture, fiscalement, c'est 3 questions :
1. **Quelle TVA** je mets ? (dépend du territoire + du régime)
2. **Quelles mentions** obligatoires ? (dépend du territoire + du régime)
3. **Sous quel format** je l'émets ? (papier/PDF aujourd'hui → Factur-X demain, réforme 2026-2027)

Factur'Peyi répond aux 3 automatiquement. Les outils métropole répondent mal à la 1 et la 2 en DOM. C'est tout le jeu.

---

## 1. La TVA — le cœur du sujet

**TVA = Taxe sur la Valeur Ajoutée.** L'entreprise la **collecte** sur ses ventes (pour l'État) et la
**déduit** sur ses achats. Elle reverse à l'État la différence. Elle n'est PAS un revenu pour l'entreprise :
elle transite par elle.

### Les taux selon le territoire

| Territoire | Taux normal | Taux réduit | Particularité |
|---|---|---|---|
| **Métropole** | 20 % | 5,5 % / 10 % / 2,1 % | Référence |
| **Martinique, Guadeloupe, La Réunion** | **8,5 %** | **2,1 %** | Taux DOM spécifiques |
| **Guyane, Mayotte** | **0 %** | — | **Exonérées** (art. 294 CGI) |
| Nouvelle-Calédonie | 11 % (TGC*) | — | Pas de TVA, une autre taxe |
| Polynésie française | 16 % | — | Monnaie XPF, hors réforme |

\* TGC = Taxe Générale sur la Consommation (équivalent local de la TVA).

👉 **Pourquoi Guyane et Mayotte à 0 % ?** L'**article 294 du Code général des impôts** exonère ces deux
territoires de TVA. Une entreprise guyanaise ne facture donc pas de TVA, mais doit l'**écrire** sur la
facture : *« TVA non applicable – article 294 du CGI »*. Si tu oublies cette mention, la facture est
juridiquement bancale. → Factur'Peyi l'ajoute tout seul selon le territoire.

### Le calcul (toujours le même)

```
Montant TVA  = Montant HT × (taux / 100)
Montant TTC  = Montant HT + Montant TVA
```
Exemple Martinique, prestation 1 000 € HT à 8,5 % :
- TVA = 1 000 × 0,085 = **85 €**
- TTC = 1 000 + 85 = **1 085 €**

HT = Hors Taxe (ce que gagne l'entreprise). TTC = Toutes Taxes Comprises (ce que paie le client).

---

## 2. Les régimes fiscaux — qui paie quoi

Le **régime** détermine comment l'entreprise est imposée et si elle gère la TVA.

| Régime | Pour qui | TVA ? |
|---|---|---|
| **Auto-entrepreneur / micro** | Petits CA, démarrage | **Franchise en base** → pas de TVA facturée |
| **Micro-BIC** | Commerçants, artisans (vente, marchandises) | Selon seuils |
| **Micro-BNC** | Professions libérales (conseil, services) | Selon seuils |
| **Réel (simplifié/normal)** | CA plus élevé | TVA pleine, déclarations périodiques |

### La "franchise en base de TVA" (art. 293 B CGI) — à bien comprendre

En dessous de certains seuils de chiffre d'affaires, une entreprise est en **franchise en base** :
elle **ne facture pas de TVA** (et ne la récupère pas sur ses achats). Mention obligatoire :
*« TVA non applicable, art. 293 B du CGI »*.

⚠️ **Règle d'or codée dans Factur'Peyi : l'auto-entrepreneur (franchise) écrase toujours la règle
territoriale.** Un auto-entrepreneur en Martinique ne met PAS 8,5 % → il met 0 % avec la mention 293 B.
C'est une subtilité que beaucoup d'outils ratent.

**294 vs 293 B — ne pas confondre :**
- **294** = exonération **géographique** (Guyane/Mayotte, peu importe la taille).
- **293 B** = franchise liée à la **petite taille** (CA sous seuil), partout en France.

---

## 3. L'octroi de mer — la taxe que la métropole ne connaît pas

**Octroi de mer = taxe douanière locale sur les marchandises** qui entrent dans les DOM
(Martinique, Guadeloupe, Guyane, La Réunion, Mayotte). Elle existe pour **protéger la production locale**
et **financer les collectivités** (communes, régions).

- Elle s'applique surtout à l'**import de biens** (pas aux prestations de service pures).
- Deux composantes : **octroi de mer** (région) + **octroi de mer régional**.
- Déclaration via le système **DOMINO-NG** (douanes) — obligatoire depuis le 1ᵉʳ juillet 2024,
  amende ~750 € en cas de manquement.

👉 Pour un cabinet, l'octroi de mer est une **source d'erreurs constante** chez les clients DOM. C'est un
argument de vente fort : Factur'Peyi le gère nativement, là où Pennylane/Sage le traitent mal.

---

## 4. Les mentions légales obligatoires sur une facture

Une facture sans les bonnes mentions est **rejetable** (par le client, par le fisc, par l'expert-comptable).
Minimum légal :
- Identité émetteur : nom/raison sociale, **forme juridique**, **adresse**, **SIRET**, **RCS/RM**, **capital** (si société).
- **N° de TVA intracommunautaire** (si assujetti).
- Identité client, **numéro de facture unique et séquentiel**, **date**.
- Détail : désignation, quantité, prix unitaire HT, **taux de TVA par ligne**, total HT, TVA, TTC.
- Mention fiscale spécifique : *art. 294* (Guyane/Mayotte), *art. 293 B* (franchise), etc.
- Conditions de paiement, pénalités de retard.

👉 C'est exactement ce que Factur'Peyi remplit depuis les **Paramètres** (les champs qu'on vient d'ajouter)
et qu'il imprime automatiquement, + multi-lignes avec TVA par ligne.

---

## 5. La réforme de la facture électronique 2026-2027 — LE sujet existentiel

### Le principe
À terme, **toutes les factures B2B (entre entreprises) devront être électroniques et structurées**,
transitant par une **plateforme agréée (PDP)**, qui transmet aussi les données au fisc (**e-reporting**).
Fini le PDF envoyé par email comme seule preuve.

### Le calendrier
- **1ᵉʳ sept. 2026** : toutes les entreprises doivent pouvoir **RECEVOIR** des factures électroniques.
  Grandes entreprises + ETI commencent à **émettre**.
- **1ᵉʳ sept. 2027** : les **TPE / PME / micro** doivent **ÉMETTRE** au format structuré.

### Les mots à connaître (pour ne pas être largué face à un comptable)
- **Factur-X** : un PDF normal **+ un fichier XML structuré caché dedans**. Lisible par un humain (le PDF)
  ET par une machine (le XML). C'est le format français de référence. ✅ **Factur'Peyi le génère déjà,
  validé PDF/A-3b par veraPDF.**
- **EN 16931** : la norme européenne qui dit quelles données doivent figurer dans le XML.
- **CII / UBL** : deux langages XML possibles ; on utilise CII (profil BASIC).
- **PDP (Plateforme de Dématérialisation Partenaire) / Plateforme Agréée** : l'intermédiaire agréé par
  l'État qui **transporte** les factures entre entreprises et **reporte** au fisc. 134 immatriculées en 2026.
- **PPF (Portail Public de Facturation)** : l'annuaire central de l'État (qui fait quoi, qui reçoit quoi).
- **e-reporting** : pour les cas SANS facture électronique (ex. **Guyane/Mayotte exonérés**, ventes aux
  particuliers), on transmet quand même les **données** (montants HT) au fisc. Sanction 250 €/transmission
  manquante, plafond 15 000 €/an.

### Ce qu'il nous reste (et la stratégie)
On **génère** le Factur-X (le plus dur, fait). Il manque le **raccordement à une PDP** pour le transport.
→ On devient **Opérateur de Dématérialisation** en se branchant sur une PDP agréée (cf `docs/PDP_SHORTLIST.md`,
candidat n°1 : Iopole). On ne devient PAS PDP soi-même (trop cher/long au début).

---

## 6. Le FEC — le pont vers le comptable

**FEC = Fichier des Écritures Comptables.** C'est un fichier texte **au format légal imposé**
(article A.47 A-1 du LPF) qui contient **toutes les écritures comptables** de l'entreprise, que le fisc
peut réclamer en cas de contrôle, et que l'**expert-comptable importe dans son logiciel** (Sage, Cegid…).

- Comptabilité = tout en **partie double** : chaque opération touche 2 comptes (un débit, un crédit) qui
  s'équilibrent. Ex. une vente : on **débite** le client (411) et on **crédite** la vente (706) + la TVA (445).
- ✅ **Factur'Peyi exporte le FEC (mois + année), TVA séparée.** C'est ce qui fait que le comptable peut
  intégrer les données sans tout ressaisir → argument-clé du démarchage cabinets.

---

## 7. Récap — pourquoi Factur'Peyi gagne en DOM

| Le client/cabinet DOM galère avec… | Factur'Peyi automatise |
|---|---|
| TVA 8,5 % / 2,1 % au lieu de 20 % | Taux selon territoire, auto |
| Exonération Guyane/Mayotte + mention 294 | Mention auto |
| Franchise 293 B qui écrase le territoire | Règle codée |
| Octroi de mer | Géré nativement |
| Réforme Factur-X 2026 | Factur-X généré + validé |
| Données à donner au comptable | Export FEC légal |

**En une phrase de vente :** *« Les outils de métropole sont faits pour 20 % de TVA et ignorent l'octroi de
mer et l'article 294. Factur'Peyi est né pour les DOM, et il est déjà au format Factur-X de la réforme. »*

---

### Mini-lexique express
- **HT / TTC** : hors taxe / toutes taxes comprises.
- **CGI** : Code général des impôts. **LPF** : Livre des procédures fiscales.
- **B2B / B2C** : entre entreprises / vers les particuliers.
- **Assujetti** : entreprise qui facture de la TVA.
- **DROM** : Départements et Régions d'Outre-Mer (Martinique, Guadeloupe, Guyane, Réunion, Mayotte).
