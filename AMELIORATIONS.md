# Factur'Peyi — Vision, Ambition & Plan de Développement
*Document de travail — Joseph & Claude, Avril 2026*

---

## VISION GLOBALE

> **Devenir le logiciel de gestion d'entreprise numéro 1 des pays et territoires francophones tropicaux — Caraïbes, Océan Indien, Afrique de l'Ouest — et générer 50 millions d'euros de revenus récurrents annuels d'ici 2031.**

Ce marché est vierge. QuickBooks n'y est pas. Sage et Pennylane n'y sont pas. Personne ne parle créole, personne ne connaît l'Octroi de mer, personne ne gère la TVA à 0% en Guyane. Factur'Peyi peut occuper ce territoire entier avant même qu'un concurrent réalise qu'il existe.

---

## OBJECTIFS CHIFFRÉS PAR ÉTAPE

| Horizon | Clients actifs | MRR cible | ARR cible |
|---|---|---|---|
| Fin 2026 | 300 | 9 000 €/mois | 108 000 € |
| Fin 2027 | 1 500 | 52 000 €/mois | 624 000 € |
| Fin 2028 | 5 000 | 200 000 €/mois | 2 400 000 € |
| Fin 2029 | 15 000 | 675 000 €/mois | 8 100 000 € |
| Fin 2030 | 40 000 | 1 800 000 €/mois | 21 600 000 € |
| Fin 2031 | 100 000 | 4 500 000 €/mois | 54 000 000 € |

**Pourquoi c'est réaliste :** Les DOM-TOM comptent ~150 000 entreprises actives. Les Caraïbes francophones (Haïti, Saint-Lucie, Dominique) ajoutent ~250 000 TPE. L'Afrique francophone représente des millions de PME totalement sous-équipées. À 100 000 clients, on n'a capturé qu'une fraction de ce marché.

**Valorisation projetée :** Un SaaS B2B à 50M€ ARR avec 10-15% de churn annuel se valorise entre **250M€ et 500M€** (multiple 5-10x) — objectif de levée de fonds Série B ou acquisition stratégique par 2031.

---

## 1. Analyse de l'Existant

### Ce qui est déjà bien fait
- Stack moderne (React 19 + Vite + Firebase + Vercel) — solide et scalable jusqu'à des millions d'utilisateurs
- Gestion complète des factures, clients, dépenses
- Comptabilité de base (journal, bilan, plan comptable)
- Export PDF / Excel / ZIP
- Multi-utilisateurs avec rôles (admin / comptable / employé)
- Intégration Stripe pour les abonnements
- Responsive mobile

### Ce qui est critique à corriger MAINTENANT
- **Firestore rules expirées** (date limite = 2025-07-21) → la base de données est non protégée. À corriger en urgence.
- Pas de période d'essai gratuite → frein massif à l'acquisition
- Pas de page de démo → impossible de montrer le produit sans payer

---

## 2. Analyse Concurrents

### QuickBooks (US) — valorisé 8 milliards de dollars, et absent de nos marchés
QuickBooks a 7 millions de clients payants. Ils ne regardent pas les Caraïbes. C'est notre fenêtre.

| Fonctionnalité QuickBooks | Priorité pour Factur'Peyi |
|---|---|
| Devis / Estimations → conversion en facture | HAUTE |
| Factures récurrentes automatiques | HAUTE |
| Rappels de paiement automatiques | HAUTE |
| Portail client (lien de paiement en ligne) | HAUTE |
| Gestion des fournisseurs / achats | MOYENNE |
| Connexion bancaire automatique | MOYENNE |
| Suivi du temps / heures facturables | MOYENNE |
| Gestion des stocks | BASSE |
| Suivi kilométrique | BASSE |
| Paie / salaires | PHASE 3 |

### Notre avantage concurrentiel absolu
**Aucun logiciel au monde ne cible spécifiquement les DOM-TOM avec leurs contraintes fiscales réelles.** C'est une forteresse naturelle : un concurrent étranger mettra 2 ans à comprendre l'Octroi de mer, la TVA guyanaise, les régimes micro-BIC/BNC locaux. Pendant ce temps, on construit la marque et la fidélité.

---

## 3. Spécificités DOM-TOM (Le Fossé Concurrentiel)

C'est ce qui rend Factur'Peyi INCOPIABLE à court terme.

### 3.1 Fiscalité par territoire

| Territoire | TVA | Population entreprises | Spécificité |
|---|---|---|---|
| Martinique | 8,5% | ~35 000 entreprises | Octroi de mer |
| Guadeloupe | 8,5% | ~40 000 entreprises | Octroi de mer |
| Guyane française | 0% | ~20 000 entreprises | Pas de TVA |
| La Réunion | 8,5% | ~55 000 entreprises | Octroi de mer |
| Mayotte | 0% | ~8 000 entreprises | Pas de TVA |
| Saint-Martin | Régime mixte | ~5 000 entreprises | Particularités douanières |

**Total DOM-TOM : ~163 000 entreprises cibles dès aujourd'hui.**

Au moment de l'inscription → demander le territoire → pré-configurer TVA, mentions légales, et déclarations automatiquement.

### 3.2 L'Octroi de Mer
Taxe locale sur les importations spécifique aux DOM. Les commerçants qui importent des marchandises doivent la déclarer.
- Champ dédié "Octroi de mer" dans les dépenses
- Apparaît dans la déclaration fiscale
- Pédagogie intégrée pour les nouveaux entrepreneurs qui ne connaissent pas

### 3.3 Régimes fiscaux DOM
- **Micro-BIC** (commerçants, artisans) : abattement 50%, seuil 188 700€
- **Micro-BNC** (professions libérales) : abattement 34%, seuil 77 700€
- **Régime réel simplifié / normal**
- **Auto-entrepreneur** : mention "TVA non applicable, art. 293 B du CGI"

Paramètre "régime fiscal" dans les réglages → adapte automatiquement les mentions légales et déclarations.

### 3.4 Mentions légales sur les factures
- Guyane/Mayotte : *"TVA non applicable - article 294 du CGI"*
- Auto-entrepreneur : *"TVA non applicable, art. 293 B du CGI"*

### 3.5 Calendrier fiscal DOM dans le dashboard
- Rappels des échéances CA12/CA3 adaptés aux DOM
- Notification : "Votre déclaration est due dans 15 jours"

---

## 4. Nouvelles Fonctionnalités

### PRIORITÉ 1 — Valeur immédiate & rétention

#### 4.1 Module Devis
- Création de devis (même UX que la facture)
- Statuts : Brouillon → Envoyé → Accepté → Refusé
- **Conversion devis → facture en 1 clic** — fonctionnalité qui fait gagner 20 minutes par transaction
- Numérotation séparée (DEV-2026-001)
- Date de validité configurable

#### 4.2 Factures Récurrentes
- Génération automatique mensuelle/trimestrielle/annuelle
- Idéal pour les SCI, les prestataires de services réguliers, les loyers
- Notification email automatique à chaque envoi

#### 4.3 Rappels de Paiement Automatiques
- J+7, J+15, J+30 après date d'échéance
- Email automatique avec lien de paiement direct
- Marquage automatique "en retard"
- Widget "À recouvrer" dans le dashboard

#### 4.4 Portail Client & Lien de Paiement
- Lien unique par facture → le client voit sa facture et paie en ligne (Stripe)
- Marque la facture payée automatiquement
- **C'est la fonctionnalité qui réduit le délai moyen de paiement de 30 jours à 3 jours** — valeur ROI immédiate pour l'utilisateur

### PRIORITÉ 2 — Enrichissement & montée en gamme

#### 4.5 Tableau de Bord Refondu
- Chiffre d'affaires annuel avec progression N-1
- Top 5 clients par CA
- Montant total à recouvrer (factures impayées)
- Prochaines entrées de trésorerie (factures dues cette semaine)
- Trésorerie prévisionnelle 30 jours
- Taux de recouvrement (%)
- Vue mensuelle / trimestrielle / annuelle

#### 4.6 Gestion des Acomptes
- Facture d'acompte (30%, 50%...)
- Facture de solde liée automatiquement
- Calcul du reste à payer en temps réel

#### 4.7 Emails Transactionnels Complets
- Bienvenue à l'inscription
- Notification de paiement reçu
- Alerte facture en retard
- Récapitulatif comptable mensuel automatique
- Alerte renouvellement d'abonnement

#### 4.8 Capture de Reçus Mobile
- Photo d'un ticket depuis le téléphone
- Crée une dépense pré-remplie
- Stockage Firebase Storage
- Lien entre reçu et dépense dans les exports

### PRIORITÉ 3 — Fonctionnalités avancées (plan Expert)

#### 4.9 Import Bancaire
- Upload relevé CSV/OFX/QIF
- Matching automatique transactions ↔ factures/dépenses
- Rapprochement bancaire simplifié

#### 4.10 Gestion Fournisseurs
- Liste fournisseurs (miroir des clients côté achats)
- Historique achats par fournisseur
- Bon de commande

#### 4.11 Multi-Projets / Chantiers
- Regrouper factures + dépenses par projet
- Rentabilité par projet
- Indispensable pour les artisans du BTP

---

## 5. Améliorations UX/UI

### 5.1 Onboarding Guidé (CRITIQUE pour la rétention J+7)
- Checklist de démarrage avec progression visuelle
- "Créez votre première facture en 2 minutes" → expérience guidée
- Tooltips contextuels sur les fonctions clés

### 5.2 Mode Sombre

### 5.3 Navigation Restructurée
- **Ventes** : factures, devis, clients
- **Achats** : dépenses, fournisseurs, catégories
- **Comptabilité** : journal, bilan, déclaration, rapports
- **Équipe** : membres, rôles
- Recherche globale (client, facture, montant)

### 5.4 Landing Page Refondue
- Démo interactive sans inscription
- Témoignages clients (commencer avec la 1ère cliente intéressée)
- Section "Factur'Peyi vs QuickBooks" — prix, langue, DOM-TOM
- Badge "Conforme réglementation française des DOM"
- Vidéo de présentation 60 secondes (en français avec accent local)
- Chat WhatsApp Business (incontournable aux Antilles)
- FAQ spécifique DOM : "Ça gère la Guyane sans TVA ?", "Qu'est-ce que l'Octroi de mer ?"

### 5.5 PWA (Application Mobile Installable)
- Installation sur écran d'accueil téléphone (iOS + Android)
- Fonctionnement hors ligne partiel
- Notifications push
- Développement léger (manifest.json + service worker)

---

## 6. Modèle Commercial & Acquisition

### 6.1 Tarification

**Problème actuel :** Payer avant de voir le produit = frein majeur à l'acquisition.

| Plan | Prix | Contenu |
|---|---|---|
| **Découverte** (30 jours) | Gratuit | Toutes les fonctions, jusqu'à 5 factures |
| **Solo** | 19,99€/mois | Factures illimitées, devis, rappels, 1 utilisateur |
| **Pro** | 34,99€/mois | Tout Solo + multi-users, récurrences, portail client, acomptes |
| **Expert** | 54,99€/mois | Tout Pro + import bancaire, multi-projets, support prioritaire |
| **Cabinet** | 199€/mois | Gestion multi-entreprises (pour experts-comptables) — jusqu'à 20 dossiers |

> QuickBooks facture $35-$235/mois aux US sans connaître l'Octroi de mer. On est meilleur et moins cher.

### 6.2 Canal B2B2C — Les Experts-Comptables Locaux
Les cabinets comptables des DOM gèrent en moyenne 80 à 200 dossiers clients.
- Plan "Cabinet" à 199€/mois = 2 400€/an par cabinet
- Un cabinet qui recommande Factur'Peyi à ses clients → effet de levier massif
- Objectif : **50 cabinets partenaires d'ici fin 2027** = 240 000€ ARR rien que sur ce canal
- Commission d'apport pour les comptables qui convertissent leurs clients

### 6.3 Programme de Parrainage
- "Parrainez un entrepreneur → 1 mois offert pour vous deux"
- Viral dans les réseaux antillais où le bouche-à-oreille est la première source de confiance
- Objectif : 30% des nouvelles inscriptions via parrainage à horizon 18 mois

### 6.4 SEO — Devenir la Référence sur Google DOM-TOM
- Blog mensuel : "Comment facturer en Guyane sans TVA", "Déclaration CA12 Martinique 2026", "Obligations comptables artisan Guadeloupe"
- Pages d'atterrissage dédiées : /martinique, /guadeloupe, /guyane, /reunion, /mayotte
- Objectif : 1er résultat Google sur "logiciel facturation Martinique" d'ici 6 mois

### 6.5 Partenariats Institutionnels
- Chambres de Commerce de Martinique, Guadeloupe, Guyane, Réunion
- Ordre des Experts-Comptables Antilles-Guyane
- BGE, Initiative France, Réseau Entreprendre DOM
- Pôle Emploi DOM (nouveaux auto-entrepreneurs)
- AFD (Agence Française de Développement) pour les TPE

---

## 7. Expansion Géographique — La Vraie Ambition

### Phase A : DOM-TOM consolidés (2026-2027)
Martinique + Guadeloupe + Guyane + Réunion + Mayotte.
**Objectif : leader incontesté sur les 163 000 entreprises DOM-TOM.**

### Phase B : Caraïbes francophones (2027-2028)
- **Haïti** : 1,2 million de micro-entreprises, aucun logiciel adapté, marché énorme
- **Saint-Lucie, Dominique, Martinique bilingue** : adaptation créole/anglais
- **Suriname** (forte communauté francophone)

Adapter la facturation aux devises locales (HTG, XCD) et aux contraintes fiscales caribéennes.

### Phase C : Afrique francophone (2028-2030)
Le marché qui rend l'objectif 50M€ non seulement réaliste mais conservateur.
- **Sénégal :** 500 000+ PME, gouvernement qui pousse la facturation électronique
- **Côte d'Ivoire :** marché le plus dynamique d'Afrique de l'Ouest, DGI impose la e-facture
- **Cameroun, Mali, Burkina Faso, Congo :** des millions de TPE sans outil de gestion
- **Maroc, Tunisie :** marchés plus matures mais ouverts à des solutions adaptées

**Pourquoi Factur'Peyi a un avantage :** l'ADN de l'entreprise est d'adapter la comptabilité française aux réalités locales non-métropolitaines. C'est exactement ce dont l'Afrique francophone a besoin.

Partenariats avec les grandes banques africaines (SGBCI, BNI, Ecobank) qui cherchent à équiper leurs clients TPE en outils de gestion.

### Phase D : Produit bancaire intégré (2030-2031)
À 40 000+ clients actifs, Factur'Peyi détient la data financière complète de dizaines de milliers d'entreprises.
- **Scoring de crédit** basé sur les flux réels → vente aux banques partenaires
- **Avance sur factures** : on connaît les factures impayées → on peut les financer (fintech)
- **Assurance impayés** : partenariat avec assureurs locaux
- Ce pivot transforme un SaaS à 50M€ en une fintech valorisée 10x plus

---

## 8. Corrections Techniques Urgentes

### 8.1 Firestore Security Rules — URGENT
`firestore.rules` a une date limite expirée (`2025-07-21`).
**La base de données est actuellement non protégée.** À corriger immédiatement.

### 8.2 Emails Transactionnels
Aucun email n'est envoyé actuellement. Intégrer Resend.com (gratuit jusqu'à 3 000 emails/mois).

### 8.3 Gestion des Erreurs
Ajouter des toasts pour succès et erreurs sur toutes les actions critiques.

### 8.4 Performance à l'échelle
- Pagination sur les listes (factures, dépenses) au-delà de 50 entrées
- Lazy loading des modules comptables (chargés uniquement si rôle admin/comptable)

---

## 9. Feuille de Route

### Phase 1 — Fondations & Premiers Clients (Mois 1-2)
- [ ] Corriger les Firestore rules (URGENT, sécurité)
- [ ] Essai gratuit 30 jours (débloque l'acquisition)
- [ ] Emails transactionnels via Resend
- [ ] Onboarding guidé (rétention)
- [ ] Sélection territoire à l'inscription (TVA + mentions légales automatiques)
- [ ] Dashboard amélioré avec KPIs et factures en retard
- [ ] Landing page refondue avec démo et témoignage

### Phase 2 — Produit Compétitif (Mois 2-4)
- [ ] Module Devis + conversion en facture
- [ ] Rappels de paiement automatiques
- [ ] Portail client + lien de paiement Stripe
- [ ] Factures récurrentes
- [ ] Gestion des acomptes
- [ ] Navigation restructurée (Ventes / Achats / Comptabilité)

### Phase 3 — Différenciation DOM-TOM (Mois 4-6)
- [ ] Octroi de mer dans dépenses et déclarations
- [ ] Régimes fiscaux (micro-BIC, BNC, auto-entrepreneur)
- [ ] Calendrier fiscal avec rappels automatiques
- [ ] Pages SEO par territoire
- [ ] PWA mobile

### Phase 4 — Croissance & Scale (Mois 6-12)
- [ ] Plan Cabinet pour experts-comptables
- [ ] Programme de parrainage
- [ ] Import bancaire
- [ ] Blog SEO — 12 articles ciblés DOM
- [ ] WhatsApp Business intégré
- [ ] Premiers partenariats institutionnels DOM

### Phase 5 — Expansion (An 2-3)
- [ ] Haïti & Caraïbes francophones
- [ ] Multi-devises (HTG, XCD)
- [ ] Version bilingue français/anglais
- [ ] Premiers clients Afrique de l'Ouest (Sénégal, Côte d'Ivoire)
- [ ] Levée de fonds Seed ou Série A

---

## 10. Métriques à Piloter

| Métrique | Cible Fin 2026 | Cible Fin 2027 |
|---|---|---|
| MRR | 9 000€ | 52 000€ |
| Clients actifs | 300 | 1 500 |
| Taux conversion essai → payant | > 25% | > 30% |
| Taux activation (facture J+7) | > 60% | > 70% |
| Churn mensuel | < 5% | < 3% |
| NPS | > 40 | > 50 |
| % clients via parrainage | 10% | 30% |

---

## 11. Positionnement & Identité

### Slogans

> *"Le logiciel de gestion pensé pour les entrepreneurs des DOM — de la première facture à la conquête du marché."*

> *"Facturez, gérez, prospérez — 100% fait pour les nôtres."*

> *"Là où QuickBooks ne va pas, Factur'Peyi est déjà là."*

### Valeurs de la marque
- **Proximité** : on connaît l'Octroi de mer, la TVA guyanaise, les réalités locales
- **Ambition** : on vise le leadership régional, pas juste survivre
- **Confiance** : conformité totale, données sécurisées, entreprise locale
- **Expansion** : on accompagne nos clients de la TPE au groupe régional

---

## 12. Potentiel de Sortie (Exit Strategy)

À horizon 2030-2031, plusieurs scénarios :

1. **Acquisition par un acteur français** (Pennylane, Sage, Cegid) qui veut s'installer dans les DOM-TOM et l'Afrique francophone sans reconstruire de zéro — prix estimé : 5-10x l'ARR = **250M€ à 500M€**
2. **Acquisition par une banque caribéenne ou africaine** qui veut la data financière de ses clients TPE
3. **IPO sur un marché africain** (Bourse Régionale des Valeurs Mobilières, BRVM) — pionnier fintech
4. **Levée de fonds Série B** et croissance autonome vers 200M€ ARR

---

## 13. Revenus Additionnels — Augmenter le Panier Moyen

L'abonnement mensuel est la base. Mais les meilleurs SaaS ne s'arrêtent pas là : ils transforment chaque client en source de revenus multiples. Objectif : **faire passer le revenu moyen par client de 35€/mois à 80-120€/mois** en combinant abonnement + modules + services + commissions.

---

### 13.1 Modules Add-on Payants (abonnement en plus du plan de base)

Ces modules s'activent à la carte depuis les paramètres. Le client paie son plan de base + les modules qu'il veut.

| Module | Prix mensuel | Cible |
|---|---|---|
| **Module Paie & Salaires** | +19,99€/mois | Entreprises avec employés — calcul des fiches de paie, charges sociales DOM |
| **Module Stocks** | +9,99€/mois | Commerçants, revendeurs — gestion des niveaux de stock, alertes rupture |
| **Module Caisse (PDV)** | +14,99€/mois | Commerces physiques — point de vente simple, tickets de caisse, clôture journalière |
| **Module CRM Avancé** | +9,99€/mois | Suivi des opportunités, pipeline commercial, relances clients |
| **Module Signature Électronique** | +7,99€/mois | Signer devis et contrats en ligne — valeur légale, zéro impression |
| **Module Projets & Temps** | +9,99€/mois | Suivi des heures par projet, facturation au temps passé |

> Un client Solo à 19,99€ qui prend Paie + Stocks + Signature passe à **57,96€/mois** sans changer de plan.

---

### 13.2 Marketplace de Services (commission sur chaque transaction)

Factur'Peyi devient une **plateforme de mise en relation** entre entrepreneurs locaux et prestataires de confiance. On ne délivre pas le service — on touche une commission de 10 à 25% sur chaque vente.

#### Comptabilité & Juridique
- **Mise en relation avec un expert-comptable partenaire** — l'utilisateur clique "Je veux déléguer ma compta" → formulaire → on le met en contact avec un cabinet partenaire → commission 15% sur le contrat annuel signé
- **Déclaration fiscale faite pour vous** — service one-shot 149€ (TVA, IR, liasse fiscale) — réalisé par un comptable partenaire, on touche 20%
- **Création de statut juridique** (SAS, SARL, auto-entrepreneur) — mise en relation avec un juriste ou LegalPlace-style — commission 25% sur le service

#### Assurances & Protection
- **Assurance Responsabilité Civile Pro** en 3 clics depuis le dashboard — partenariat avec un assureur local ou national — commission récurrente mensuelle (~8-12€/mois par client)
- **Assurance impayés** — le client active la protection contre les factures non réglées — prime basée sur le CA — commission récurrente
- **Mutuelle santé entrepreneur** — un angle souvent négligé par les indépendants DOM — partenariat AXA, Malakoff, etc.

#### Financement
- **Avance sur factures (Factoring)** — le client a une facture de 5 000€ à 60 jours → on lui avance 80% maintenant → on récupère les 20% restants à l'encaissement → taux de service 2-4% — soit en propre, soit via partenaire fintech
- **Micro-crédit TPE** — partenariat avec une banque ou un fonds de garantie DOM (BPI France, AFD) → le client fait une demande de prêt depuis Factur'Peyi → on a déjà ses données financières → l'instruction est rapide → commission d'apport de 1-2% du montant

#### Outils & Technologie
- **Logiciel de caisse certifié NF525** — mise en relation ou revente d'une solution partenaire
- **Terminal de paiement** (Sumup, Stripe Reader) — revente avec marge ou commission d'activation
- **Nom de domaine + site vitrine** pour les artisans qui n'ont pas de présence web — partenariat hébergeur

---

### 13.3 Formation & Éducation (revenus one-shot + récurrents)

Les entrepreneurs des DOM sont souvent isolés et manquent d'accompagnement. La formation est un besoin réel et un différenciateur fort.

| Produit | Prix | Format |
|---|---|---|
| **Mini-formation "Comprendre sa comptabilité en DOM"** | 49€ one-shot | Vidéos en ligne, accès à vie |
| **Webinaire mensuel "Fiscalité des Antilles"** | Inclus Pro / 9€ Solo | Live 1h + replay, animé par un comptable partenaire |
| **Pack "Démarrer son entreprise en Martinique"** | 99€ one-shot | Guide PDF + vidéos + checklist juridique + 1h de conseil |
| **Coaching individuel 1h** | 79€/session | Avec un comptable ou conseiller partenaire — on prend 30% |
| **Certification Factur'Peyi** | 199€ | Pour les comptables qui veulent devenir revendeurs agréés |

> La formation a une marge quasi nulle en coûts variables. Chaque vente est du profit quasi-pur.

---

### 13.4 Données & Intelligence (revenus B2B)

À 5 000+ clients actifs, Factur'Peyi dispose de la plus grande base de données financières des TPE des DOM. Cette donnée agrégée et anonymisée a une valeur énorme.

- **Rapport sectoriel anonymisé** vendu aux CCI, banques, collectivités : "Santé financière des TPE de Martinique — 2027" — prix : 2 000€ à 10 000€ le rapport
- **Benchmark personnalisé** pour le client : "Votre CA est 23% au-dessus de la moyenne des artisans de votre secteur en Guadeloupe" — inclus plan Expert, vendu 4,99€/mois pour les autres
- **API d'accès aux données** pour les experts-comptables et banques partenaires (scoring) — facturation à la requête ou forfait mensuel

---

### 13.5 Programme White Label (revenu B2B massif)

À partir d'un certain niveau de maturité, revendre la plateforme sous marque blanche à d'autres acteurs.

- **Banques caribéennes et africaines** : "Offrez un logiciel de gestion à vos clients TPE" — la banque paye un forfait mensuel par client activé (ex: 8€/client/mois) → à 10 000 clients bancaires activés = **80 000€/mois récurrents sans effort commercial**
- **Chambres de Commerce DOM** : elles veulent offrir un outil à leurs adhérents → licence annuelle blanche
- **Opérateurs télécom** (Orange Caraïbes, SFR Antilles) : bundle "Forfait Pro + Factur'Peyi" → le client paie son forfait téléphone, l'opérateur nous reverse un abonnement

---

### 13.6 Impact sur le Panier Moyen — Projection

| Scénario client | Abonnement | Modules | Services marketplace | Total/mois |
|---|---|---|---|---|
| Auto-entrepreneur basique | Solo 19,99€ | — | — | **19,99€** |
| Artisan avec 1 employé | Pro 34,99€ | Paie +19,99€ | Assurance RC +10€ | **64,98€** |
| Commerçant actif | Pro 34,99€ | Stocks +9,99€, Caisse +14,99€ | Avance factures +15€ | **74,97€** |
| PME structurée | Expert 54,99€ | Paie +19,99€, Signature +7,99€ | Comptable partenaire +25€ | **107,97€** |
| Cabinet comptable | Cabinet 199€ | — | Formation clients +50€ | **249€** |

**Objectif panier moyen pondéré : 75€/mois à horizon 2028** (vs 35€ aujourd'hui)

À 40 000 clients × 75€ = **3 000 000€/mois = 36M€ ARR** rien que sur la base DOM-TOM + Caraïbes, avant l'Afrique.

---

*Document créé le 24 Avril 2026 — Vision portée par Joseph, entrepreneur des Antilles.*
*"Si ton rêve ne te fait pas peur, c'est qu'il n'est pas assez grand."*
