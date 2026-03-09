# Spécifications Techniques - Application de Comptabilité

## Vue d'ensemble du projet

**Application de gestion comptable pour petites entreprises françaises.**

Une application web responsiveavec permettant la gestion complète des prestations, paiements, clients et génération de documents PDF pour les recus et facture avec système de templates basés sur des documents Google Docs.

Les donnees sont stockées dans dans des documents Google Sheets.

## Stack Technique

### Frontend
- **Framework**: React 18+
- **Langage**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API + Hooks

### Intégration Google
- **Authentification**: Google OAuth 2.0 (user login)
- **API Google Sheets**: Pour lecture/écriture des données
- **API Google Docs**: Pour templates de factures/reçus
- **API Google Drive**: Pour export et stockage des PDFs

### Génération de Documents
- **Méthode**: Templates Google Docs → remplacement de variables → export PDF via API
- **Stockage**: PDFs sauvegardés dans Google Drive, URLs stockées dans Sheets

### Déploiement
- **Hébergement**: Static hosting (Vercel ou Netlify)
- **Type**: Single Page Application (SPA)
- **Build**: Production optimisée via Vite

### Dépendances Principales
- `react`, `react-dom`
- `react-router-dom`
- `@google/oauth2`, `googleapis`
- `tailwindcss`
- `axios` ou `fetch` pour les appels API

## Interface Utilisateur

### Navigation Principale
- **Sidebar/Menu**: Tableau de bord, Prestations, Paiements, Clients, Types de Prestations
- **Header**: Utilisateur connecté, déconnexion, sélecteur d'année

### Écrans Détaillés

#### 1. Tableau de Bord (Page d'accueil)
Le tableau de bord doit contenir les sections suivantes.

**Sélecteur d'année**:
Dropdown pour filtrer les statistiques, par defaut sur l'année en cours.
Il est aussi possible de choisir l'ensemble des donnees ("tout").

**Prestations**:
Une section avec ce format:
```
NOMBRE prestations (MONTANT €) sur l'annee ANNEE.
NOMBRE prestations (MONTANT €) n'ont pas de paiement.
```

**Paiements**:
Une section avec ce format:
```
NOMBRE paiements (MONTANT €) sur l'annee ANNEE
NOMBRE paiements (MONTANT €) sont en attente de reglement
```

**Clients**
Une section avec ce format:
```
NOMBRE clients enregistres

Client avec les plus gros paiements en attente:
  - CLIENT1 a 2 paiements (120 €)
  - CLIENT2 a 1 paiements (50 €)
  - CLIENT3 a 1 paiements (20 €)
```

**Listes récentes**:
Cette section affichent les informations suivantes:
- 5 dernières prestations créées
- 5 derniers paiements
- Paiements non encaissés (alerte visuelle)

#### 2. Gestion des Clients
- **Liste**: Tableau avec nom, email, téléphone, actions (éditer, supprimer)
- **Recherche**: Par nom, email ou téléphone
- **Formulaire création/édition**:
  - Nom (requis)
  - Email (requis, validation format)
  - Téléphone (optionnel)
  - Adresse (textarea, multi-lignes)
  - Numéro SIRET (optionnel, 14 chiffres)
- **Validation suppression**: Avertir si prestations/paiements associés

#### 3. Gestion des Types de Prestations
- **Liste**: Tableau avec nom, montant suggéré, actions
- **Formulaire création/édition**:
  - Nom (requis)
  - Montant suggéré (nombre, requis, > 0)
- **Validation suppression**: Avertir si prestations associées

#### 4. Gestion des Prestations
- **Liste**: Tableau avec date, client, type, montant, statut paiement, actions
- **Filtres**: Par année, par client, par type, par statut (payé/non payé)
- **Recherche**: Par nom de client ou type
- **Formulaire création/édition**:
  - Date (requis, date picker)
  - Client (requis, dropdown ou autocomplete)
  - Type de prestation (requis, dropdown)
  - Montant (pré-rempli depuis montant suggéré, éditable, requis, > 0)
- **Actions de masse**: Sélectionner plusieurs prestations pour créer un paiement
- **Indicateur visuel**: Badge "Payé" / "Non payé"

#### 5. Gestion des Paiements
- **Liste**: Tableau avec référence, client, total, date encaissement, statut, actions
- **Filtres**: Par année, par client, par statut (encaissé/non encaissé)
- **Création depuis prestations sélectionnées**:
  - Afficher liste des prestations sélectionnées
  - Vérifier même client
  - Calculer total automatiquement
  - Générer référence automatique (yymmddnnnn)
  - Mode d'encaissement (optionnel à la création)
  - Date d'encaissement (optionnel à la création)
- **Génération facture**: Bouton pour créer PDF à partir du template
- **Encaissement**:
  - Date d'encaissement (date picker)
  - Mode (dropdown: virement, espèce, chèque, paypal, autre)
- **Génération reçu**: Disponible après encaissement
- **Liens documents**: Facture et reçu cliquables vers Google Drive

#### 6. Page de Connexion
- **Bouton "Se connecter avec Google"**
- Message d'accueil / instructions
- Gestion des erreurs d'authentification

### Principes d'UX
- Design responsive (mobile-first)
- Confirmations pour suppressions
- Messages de succès/erreur (toasts ou notifications)
- Loading states pendant les appels API
- Formulaires avec validation en temps réel
- Accessibilité (ARIA labels, navigation clavier)

## Contraintes Techniques

L'application doit etre accessible via un navigateur web et facilement utilisable sur telephone et tablette.

Il n'est pas necessaire de gerer des utilisations simultanées puisqu'il n'y a qu'un seul utilisateur du systeme.

Les donnees doivent etre sauvegarder dans un document googlesheet, tel que defini plus bas, que l'utilisateur peut eventuellement editer manuellement.

## Authentification & Sécurité

### Flow OAuth Google
1. Utilisateur clique sur "Se connecter avec Google"
2. Redirection vers Google OAuth consent screen
3. Utilisateur autorise les scopes:
   - `https://www.googleapis.com/auth/spreadsheets` (lecture/écriture Sheets)
   - `https://www.googleapis.com/auth/documents` (lecture/écriture Docs)
   - `https://www.googleapis.com/auth/drive.file` (création fichiers Drive)
4. Redirection vers l'app avec token
5. Token stocké dans localStorage
6. Refresh token automatique avant expiration

### Gestion de Session
- Token JWT stocké localement
- Vérification token au chargement de l'app
- Déconnexion: suppression token + redirection vers login
- Session expirée: notification + redirection automatique

### Configuration Google Cloud Project
- Créer projet dans Google Cloud Console
- Activer APIs: Google Sheets, Google Docs, Google Drive
- Créer OAuth 2.0 Client ID
- Configurer domaines autorisés (localhost + domaine production)

## Génération de Documents PDF

### Templates Google Docs

#### Template Facture et Reçu
Documents Google Docs avec variables à remplacer (toutes disponibles pour les deux types) :

**Informations Paiement:**
- `{{REFERENCE_PAIEMENT}}`: ID du paiement
- `{{DATE_FACTURE}}`: Date de création du document
- `{{DATE_ENCAISSEMENT}}`: Date d'encaissement (ou "Non encaissé")
- `{{MODE_ENCAISSEMENT}}`: Mode de paiement (ou "Non spécifié")
- `{{TOTAL}}`: Montant total

**Informations Client:**
- `{{NOM_CLIENT}}`: Nom du client
- `{{EMAIL_CLIENT}}`: Email du client
- `{{TELEPHONE_CLIENT}}`: Téléphone du client (ou "Non renseigné")
- `{{ADRESSE_CLIENT}}`: Adresse complète (ou "Non renseignée")
- `{{SIRET_CLIENT}}`: Numéro SIRET (ou "Non renseigné")

**Détails:**
- `{{LISTE_PRESTATIONS}}`: Tableau des prestations (date, type, montant)

### Processus de Génération
1. **Copier le template**: Créer copie du template Google Docs
2. **Remplacer variables**: Utiliser Google Docs API pour remplacer les placeholders
3. **Export PDF**: Exporter via Drive API en format PDF
4. **Stockage**: Sauvegarder PDF dans dossier Google Drive spécifique
5. **URL**: Récupérer lien partageable et stocker dans Google Sheets
6. **Nettoyage**: Supprimer la copie temporaire du Doc

### Organisation Google Drive
```
/Comptabilité/
  ├── Templates/
  │   ├── Template_Facture.gdoc
  │   └── Template_Recu.gdoc
  ├── Factures/
  │   ├── 2025/
  │   └── 2026/
  └── Reçus/
      ├── 2025/
      └── 2026/
```

## Formats et Conventions de Données

### Formats de Date
- **Format affichage**: DD/MM/YYYY (ex: 15/03/2026)
- **Format stockage Google Sheets**: YYYY-MM-DD (ISO 8601)
- **Conversion automatique**: À l'affichage et à la sauvegarde

### Formats Monétaires
- **Devise**: Euro (€)
- **Format affichage**: Espace comme séparateur de milliers, virgule pour décimales (ex: 1 234,56 €)
- **Format stockage**: Nombre décimal (ex: 1234.56)
- **Précision**: 2 décimales maximum

### Génération ID Paiement
- **Format**: `yymmddnnnn`
  - `yy`: 2 chiffres année (ex: 26 pour 2026)
  - `mm`: 2 chiffres mois (01-12)
  - `dd`: 2 chiffres jour (01-31)
  - `nnnn`: 4 chiffres séquentiels pour le jour (0001-9999)
- **Exemple**: 260315001 (1er paiement du 15 mars 2026)
- **Génération**: Chercher le dernier numéro du jour et incrémenter

### Validation Email
- Format standard RFC 5322
- Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### Validation SIRET
- 14 chiffres exactement
- Optionnel
- Validation avec algorithme de Luhn (optionnelle)

## Gestion des Erreurs

### Erreurs API Google
- **Rate limiting**: Retry avec exponential backoff
- **Token expiré**: Refresh automatique puis retry
- **Permissions insuffisantes**: Message explicite à l'utilisateur
- **Réseau**: Détection offline, queue des modifications

### Erreurs Métier
- **Client inexistant**: Message d'erreur avec suggestion
- **Montant invalide**: Validation formulaire en temps réel
- **Clients différents**: Bloquer création paiement groupé
- **Suppression avec dépendances**: Modal avec liste des dépendances

### Erreurs Techniques
- **Crash application**: Error boundary React
- **Données corrompues**: Validation au chargement + fallback
- **Google Sheets inaccessible**: Mode lecture seule + cache local

### Notifications Utilisateur
- **Succès**: Toast vert 3 secondes (ex: "Client créé avec succès")
- **Erreur**: Toast rouge avec action (ex: "Erreur réseau - Réessayer")
- **Avertissement**: Toast orange (ex: "Ce client a des prestations associées")
- **Information**: Toast bleu (ex: "Synchronisation en cours...")

## Modèles de Données

Voici les differents tab de la googlesheet qui contient les donnees.

Tab "Clients":
- nom: nom du client
- email: email du client
- telephone: telephone du client
- adresse: adresse du client sur une ou plusieurs ligne
- numero_siret: numero siret du client

Tab TypeDePrestation
- nom: nom du type de prestation (exemple: "Cours individuel a l'unite")
- montant_suggere: un montant a suggerer dans l'application. L'utilisateur peut le changer au moment de la creation de la prestation.

Tab Prestation
- date: la date de la prestation
- nom_client: le nom du client
- type_prestation: le type de la prestation
- montant: le montant de la prestation, en euro
- paiement_id: une reference sur le paiement s'il y en a un

Tab Paiement
- reference: l'ID du paiement, avec le format yymmddnnnn
- client: le nom du client
- total: le montant du paiement
- date_encaissement: la date d'encaissement
- mode_encaissement: le mode d'encaissement (virement, espece, cheque, paypal, autre)
- facture: l'url de la facture s'il y en a une
- recu: l'url du recu s'il y en a un

## Logique Métier

### Workflow prestations → paiements

1. Créer prestations individuelles
2. Sélectionner des prestations d'un même client pour créer un paiement
3. Generer une facture pour ce paiement
4. Encaisser le paiement (date + mode)
5. Générer un reçu pour ce paiement

### Validations métier

- Client obligatoire pour prestation
- Type prestation obligatoire
- Montant > 0
- Même client pour paiement groupé
- Pas de suppression si dépendances

### Contraintes référentielles

- Prestation → Client (obligatoire)
- Prestation → TypePrestation (obligatoire)
- Prestation → Paiement (optionnel)
- Paiement → Client (obligatoire)

### Sauvegarde données

- Sauvegarde automatique à chaque modification

## Architecture de l'Application

### Structure des Dossiers
```
src/
├── components/          # Composants React réutilisables
│   ├── common/         # Composants génériques (Button, Input, Modal...)
│   ├── layout/         # Layout, Sidebar, Header
│   └── forms/          # Formulaires spécifiques
├── pages/              # Pages principales (Dashboard, Clients, etc.)
├── services/           # Services API et logique métier
│   ├── googleAuth.ts   # Authentification Google
│   ├── googleSheets.ts # Intégration Google Sheets
│   ├── googleDocs.ts   # Génération documents
│   ├── clients.ts      # CRUD clients
│   ├── prestations.ts  # CRUD prestations
│   └── paiements.ts    # CRUD paiements
├── contexts/           # Contexts React (Auth, Data)
├── hooks/              # Custom hooks
├── utils/              # Fonctions utilitaires
│   ├── dateFormatter.ts
│   ├── currencyFormatter.ts
│   └── validators.ts
├── types/              # Types TypeScript
└── constants/          # Constantes (scopes API, configs)
```

### Couches de l'Application

#### 1. Couche Présentation (Components/Pages)
- Composants React purs
- Gestion UI et interactions utilisateur
- Consomment les hooks et contexts

#### 2. Couche État (Contexts + Hooks)
- **AuthContext**: État authentification, user info
- **DataContext**: Données métier (clients, prestations, paiements)
- **NotificationContext**: Gestion toasts/notifications
- Custom hooks pour logique réutilisable

#### 3. Couche Services (Business Logic)
- Communication avec APIs Google
- Transformations données (Sheets ↔ App)
- Validations métier
- Génération documents

#### 4. Couche Utilitaires
- Formatage dates/montants
- Validateurs
- Helpers génériques

### Gestion du Cache Local

#### Cache Strategy
- **Données lues**: Cache en mémoire (Context)
- **Modifications**: Optimistic updates + sync avec Sheets
- **Invalidation**: Au reload ou après timeout (5 min)

#### Synchronisation
- Chargement initial: Fetch toutes les données au login
- Modifications: Update immédiat local + API call
- En cas d'échec: Rollback + retry ou notification

## Configuration Environnement

### Variables d'Environnement
```
VITE_GOOGLE_CLIENT_ID=           # OAuth Client ID
VITE_GOOGLE_REDIRECT_URI=        # URL de redirection OAuth
VITE_SPREADSHEET_ID=             # ID du Google Sheet principal
VITE_TEMPLATE_FACTURE_ID=        # ID du template facture
VITE_TEMPLATE_RECU_ID=           # ID du template reçu
VITE_DRIVE_FOLDER_FACTURES_ID=   # ID dossier Drive factures
VITE_DRIVE_FOLDER_RECUS_ID=      # ID dossier Drive reçus
```

### Fichiers de Configuration
- `.env.development`: Variables pour dev local
- `.env.production`: Variables pour production
- `tailwind.config.js`: Configuration Tailwind
- `vite.config.ts`: Configuration Vite
- `tsconfig.json`: Configuration TypeScript

## Tests (Optionnel mais Recommandé)

### Tests Unitaires
- **Framework**: Vitest (natif Vite)
- **Cible**: Services, utils, validators
- **Exemple**: Validation formats, génération IDs

### Tests Composants
- **Framework**: React Testing Library
- **Cible**: Composants forms, boutons, modals
- **Exemple**: Soumission formulaire, validation inputs

### Tests E2E (Pour plus tard)
- **Framework**: Playwright ou Cypress
- **Scénarios critiques**:
  - Login → Créer prestation → Créer paiement → Générer facture
  - CRUD complet sur un client

## Performance

### Optimisations React
- Lazy loading des pages (React.lazy + Suspense)
- Memoization (useMemo, useCallback) pour calculs lourds
- Éviter re-renders inutiles

### Optimisations Réseau
- Batch des requêtes Google Sheets si possible
- Pagination des listes (100+ items)
- Compression des réponses

### Chargement Initial
- Skeleton loaders pendant fetch
- Progressive loading (afficher partiellement)
- Cache des données fréquentes

## Limitations et Contraintes

### Quotas Google APIs
- **Sheets API**: 300 requêtes/minute/projet
- **Docs API**: 300 requêtes/minute/projet
- **Drive API**: 1000 requêtes/100 secondes/utilisateur
- **Stratégie**: Rate limiting côté client + retry logic

### Limitations Techniques
- Un seul utilisateur simultané (pas de gestion conflits)
- Pas de mode offline complet (lecture seule possible)
- Dépendance à Google (pas de backend alternatif)

### Volumes de Données
- Maximum recommandé: 10,000 prestations/an
- Maximum Google Sheets: 5 millions de cellules
- Performance dégradée au-delà de 1000 lignes (envisager pagination)

## Évolutions Futures (V2+)

### Fonctionnalités Additionnelles
- Export comptable (CSV pour logiciels compta)
- Statistiques avancées (graphiques interactifs)
- Multi-utilisateurs avec permissions
- Notifications email automatiques
- Templates multiples de factures/reçus
- Mode sombre
- Support multi-devises
- Récurrence de prestations
- Gestion des devis

### Améliorations Techniques
- PWA (Progressive Web App) pour mode offline
- Backend API (Node.js/Python) pour logique complexe
- Base de données réelle (PostgreSQL/MongoDB)
- Websockets pour sync temps réel
- Tests automatisés complets

## Livrables

### Phase 1 - MVP
- [ ] Setup projet (Vite + React + TypeScript + Tailwind)
- [ ] Configuration Google OAuth
- [ ] Interface connexion
- [ ] CRUD Clients
- [ ] CRUD Types de Prestations
- [ ] CRUD Prestations
- [ ] CRUD Paiements
- [ ] Intégration Google Sheets (lecture/écriture)
- [ ] Tableau de bord basique
- [ ] Génération factures PDF
- [ ] Génération reçus PDF
- [ ] Déploiement production

### Phase 2 - Améliorations
- [ ] Statistiques avancées dashboard
- [ ] Graphiques
- [ ] Filtres et recherche avancés
- [ ] Export données
- [ ] Tests unitaires
- [ ] Documentation utilisateur

## Annexes

### Ressources
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)

### Contacts et Support
- Développeur: [À compléter]
- Repository: [À compléter]
- Documentation: [À compléter]
