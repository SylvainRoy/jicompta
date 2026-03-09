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
- **Hébergement**: GitHub Pages ou Firebase Hosting (static hosting)
- **Type**: Single Page Application (SPA) + Progressive Web App (PWA)
- **Build**: Production optimisée via Vite
- **PWA**:
  - Manifest configuré (manifest.json)
  - Service Worker pour mise en cache
  - Installable sur mobile (Android et iOS)
  - Icônes et splash screens configurés
  - Mode standalone pour expérience app native

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
Le tableau de bord contient les sections suivantes (implémenté).

**Sélecteur d'année**:
- Dropdown en haut à droite avec icône calendrier
- Filtrage des statistiques par année
- Par défaut sur l'année en cours
- Option "Toutes" pour voir l'ensemble des données
- Design: fond blanc avec bordure, style moderne

**Section Prestations**:
- Card avec gradient bleu et icône document
- Affiche: nombre de prestations et montant total pour l'année sélectionnée
- Lien cliquable vers les prestations sans paiement avec:
  - Design: fond orange avec flèche de navigation
  - Hover: transition et déplacement de la flèche
  - Redirige vers /prestations avec filtre "non_facturee"

**Section Paiements**:
- Card avec gradient vert et icône paiement
- Affiche: nombre de paiements et montant total pour l'année sélectionnée
- Lien cliquable vers les paiements en attente avec:
  - Design: fond rouge avec flèche de navigation
  - Hover: transition et déplacement de la flèche
  - Redirige vers /paiements avec filtre "en_attente"

**Section Clients**:
- Card avec gradient violet et icône utilisateurs
- Affiche: nombre total de clients enregistrés
- Sous-section "Clients avec les plus gros paiements en attente":
  - Top 3 des clients avec montant total en attente
  - Chaque client est cliquable et redirige vers /paiements avec filtre client spécifique
  - Design: cartes blanches avec flèche de navigation au hover

**Listes récentes** (grille 3 colonnes):
1. **5 dernières prestations créées**:
   - En-tête: gradient bleu avec icône
   - Liste avec client, type, date, montant
   - Hover: fond bleu clair

2. **5 derniers paiements**:
   - En-tête: gradient vert avec icône
   - Liste avec référence, client, date/statut, montant
   - Icônes de statut: ✓ (encaissé) ou ⏰ (en attente)
   - Hover: fond vert clair

3. **Paiements non encaissés** (alerte):
   - En-tête: gradient rouge avec icône avertissement
   - Liste des paiements en attente avec icône ⚠️
   - Si vide: affiche icône ✓ verte "Tous les paiements sont encaissés"
   - Hover: fond rouge clair

**Améliorations visuelles**:
- Gradients de couleur pour chaque section
- Icônes colorées dans des carrés arrondis avec ombres
- Animations de transition au survol
- Flèches de navigation qui se déplacent au hover
- Typography améliorée avec titres plus grands
- Espacement et padding optimisés

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
- **Filtres**: Par statut (non facturée / facturée / encaissée)
- **Recherche**: Par nom de client ou type
- **Tri**: Par date décroissant (plus récent en premier)
- **Formulaire création/édition**:
  - Date (requis, date picker)
  - Client (requis, dropdown)
  - Type de prestation (requis, dropdown)
  - Montant (pré-rempli depuis montant suggéré, éditable, requis, > 0)
- **Actions de masse**: Sélectionner plusieurs prestations pour créer un paiement
- **Indicateur visuel**:
  - Badge "Non facturée" (jaune) - pas de paiement lié
  - Badge "Facturée" (bleu) - paiement créé mais non encaissé
  - Badge "Encaissée" (vert) - paiement encaissé
- **Protection**: Impossible d'éditer ou supprimer une prestation liée à un paiement
- **URL parameters**: Support des paramètres `?filter=` pour liens directs depuis dashboard

#### 5. Gestion des Paiements
- **Liste**: Tableau avec référence, client, total, date encaissement, statut, actions
- **Filtres**: Par statut (encaissé / en attente)
- **Recherche**: Par nom de client ou référence
- **Tri**: Par référence décroissant (plus récent en premier, format: yymmddnnnn)
- **Création depuis prestations sélectionnées**:
  - Afficher liste des prestations sélectionnées
  - Vérifier même client (validation)
  - Calculer total automatiquement
  - Générer référence automatique (format: yymmddnnnn)
  - Mode d'encaissement (optionnel à la création)
  - Date d'encaissement (optionnel à la création)
- **Génération facture**:
  - Bouton pour créer PDF à partir du template Google Docs
  - Si facture existe déjà, ouvre directement le PDF
  - Notification persistante pendant la génération (~10-15s)
  - PDF stocké dans Drive: `Comptabilite/Factures/YYYY/`
- **Encaissement**:
  - Date d'encaissement (date picker)
  - Mode (dropdown: Virement, Espèce, Chèque, PayPal, Autre)
- **Génération reçu**:
  - Disponible uniquement après encaissement
  - Même processus que facture
  - PDF stocké dans Drive: `Comptabilite/Recus/YYYY/`
- **Suppression**:
  - Possible uniquement si paiement non encaissé
  - Délie automatiquement toutes les prestations associées
  - Confirmation requise avec détails des prestations impactées
- **Indicateur visuel**:
  - Badge "En attente" (orange) - pas de date d'encaissement
  - Badge "Encaissé" (vert) - avec date d'encaissement
  - Label "Facture générée" ou "Reçu généré" (gris) selon documents disponibles
- **Liens documents**: Facture et reçu cliquables vers PDF dans Google Drive
- **URL parameters**: Support des paramètres `?filter=` et `?client=` pour liens directs

#### 6. Page de Connexion
- **Bouton "Se connecter avec Google"**
- Message d'accueil / instructions
- Gestion des erreurs d'authentification
- Après connexion: auto-détection ou création de la configuration

#### 7. Configuration Automatique
L'application dispose d'un système de configuration automatique qui détecte ou crée la structure Google Drive nécessaire.

**Auto-détection** (`checkExistingSetup()`):
1. Recherche d'un dossier `Comptabilite` dans Google Drive
2. Recherche du spreadsheet `Compta` dans ce dossier
3. Recherche des sous-dossiers: `Factures`, `Recus`, `Modeles`
4. Recherche des templates: `Modèle de Facture`, `Modèle de Reçu`
5. Si trouvé: charge automatiquement la configuration

**Auto-setup** (`autoSetup()`):
Si aucune configuration existante n'est trouvée:
1. Crée la structure de dossiers dans Drive: `Comptabilite/Factures/`, `Comptabilite/Recus/`, `Comptabilite/Modeles/`
2. Crée le spreadsheet `Compta` avec 4 onglets et en-têtes:
   - `Clients`: nom, email, telephone, adresse, numero_siret
   - `TypeDePrestation`: nom, montant_suggere
   - `Prestation`: date, nom_client, type_prestation, montant, paiement_id
   - `Paiement`: reference, client, total, date_encaissement, mode_encaissement, facture, recu
3. Crée les templates de documents dans `Modeles/`:
   - `Modèle de Facture` avec placeholders
   - `Modèle de Reçu` avec placeholders
4. Sauvegarde la configuration dans localStorage (`jicompta_config`)
5. Prêt à utiliser (durée totale: ~15 secondes)

**Multi-device**:
- Configuration stockée dans localStorage (spécifique à chaque device)
- Premier login sur nouvel appareil: auto-détecte la config existante
- Pas de synchronisation nécessaire (tout est dans Google Drive)

**Page Configuration**:
- Affichage des IDs des ressources Google Drive
- Possibilité de réinitialiser la configuration
- Liens vers les ressources dans Google Drive

### Principes d'UX
- Design responsive (mobile-first) avec cartes mobiles et tableaux desktop
- Confirmations modales pour suppressions
- Messages de succès/erreur (toasts notifications avec système de notifications persistantes)
- Loading states pendant les appels API (spinners avec messages)
- Formulaires avec validation en temps réel
- Accessibilité (ARIA labels, navigation clavier)
- Auto-refresh: rechargement automatique des données quand l'app redevient visible
- Protection des données: impossible de modifier/supprimer des prestations liées à des paiements
- Tri par date décroissant: listes affichées du plus récent au plus ancien
- Navigation contextuelle: liens cliquables depuis le dashboard vers vues filtrées

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
│   ├── googleAuth.ts   # OAuth flow, token management, user info
│   ├── googleSetup.ts  # Auto-setup wizard, Drive resource creation
│   ├── googleSheets.ts # CRUD operations pour les 4 sheets
│   └── googleDocs.ts   # Génération PDF (factures/reçus)
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
L'application utilise **React Context API** avec une architecture à 4 couches:

1. **AuthContext** (`src/contexts/AuthContext.tsx`):
   - Gère la session Google OAuth
   - Charge/valide les tokens depuis localStorage
   - Fournit: `user`, `isAuthenticated`, `logout`, `handleGoogleSuccess`

2. **ConfigContext** (`src/contexts/ConfigContext.tsx`):
   - Gère les IDs des ressources Google Drive
   - Cached dans localStorage (`jicompta_config`)
   - Auto-détection via `checkExistingSetup()`
   - Fournit: `config`, `isConfigured`, `saveConfig`, `clearConfig`

3. **DataContext** (`src/contexts/DataContext.tsx`):
   - **Context principal** - gère toutes les données métier
   - Charge depuis Google Sheets quand `isAuthenticated && isConfigured`
   - Fournit les opérations CRUD: clients, typesPrestations, prestations, paiements
   - Toutes les mutations rafraîchissent depuis Sheets pour maintenir la sync
   - Fournit: `refreshAll()`, `addClient()`, `updateClient()`, `deleteClient()`, etc.
   - Auto-refresh: recharge les données quand l'app redevient visible

4. **NotificationContext** (`src/contexts/NotificationContext.tsx`):
   - Gestion des toasts/notifications
   - Support notifications persistantes (pour génération PDF)
   - Fournit: `success()`, `error()`, `info()`, `warning()`, `removeNotification()`

**Ordre des providers** (dans `App.tsx`):
```
AuthProvider
  → ConfigProvider
    → DataProvider
      → NotificationProvider
        → Routes
```
Cet ordre est critique: ConfigContext dépend d'AuthContext, DataContext dépend des deux.

**Pattern de mutation**:
Toutes les mutations suivent: API call → refresh → update state
Exemple: `addClient()` → `sheetsService.addClient()` → `refreshClients()` → state update

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

## Fonctionnalités Implémentées

### Terminé
- ✅ PWA (Progressive Web App) avec support installation mobile
- ✅ Auto-refresh des données au retour sur l'app
- ✅ Protection des données (prestations liées non modifiables)
- ✅ Suppression de paiements avec déliage automatique des prestations
- ✅ Navigation contextuelle depuis le dashboard avec filtres
- ✅ Système de configuration automatique
- ✅ Design amélioré avec gradients, icônes et animations
- ✅ Tri par date décroissant (plus récent d'abord)
- ✅ Statuts de paiement détaillés (non facturée/facturée/encaissée)
- ✅ Labels de statut traduits et cohérents

## Évolutions Futures (V2+)

### Fonctionnalités Additionnelles
- Backup et restore de la Google Sheet
- Export comptable PDF pour déclaration fiscale française
- Export CSV pour logiciels comptables
- Statistiques avancées (graphiques interactifs avec charts)
- Multi-utilisateurs avec permissions
- Notifications email automatiques
- Templates multiples de factures/reçus
- Mode sombre
- Support multi-devises
- Récurrence de prestations
- Gestion des devis
- Rapports mensuels/annuels automatiques

### Améliorations Techniques
- Mode offline complet avec synchronisation
- Backend API (Node.js/Python) pour logique complexe
- Base de données réelle (PostgreSQL/MongoDB)
- Websockets pour sync temps réel
- Tests automatisés complets (unit + E2E)
- Optimisation des performances pour grands volumes
- Migration TypeScript stricte (mode strict)

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
