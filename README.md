# ComptaClaude

Application de gestion comptable pour petites entreprises françaises.

## 🚀 Technologies

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API + Hooks
- **APIs**: Google OAuth 2.0, Google Sheets, Google Docs, Google Drive

## 📦 Installation

### Prérequis

- Node.js 18+ et npm
- Un compte Google
- Accès à Google Cloud Console

### Étapes d'installation

1. **Cloner et installer les dépendances**

```bash
cd comptaclaude
npm install
```

2. **Configuration Google Cloud**

- Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
- Activer les APIs:
  - Google Sheets API
  - Google Docs API
  - Google Drive API
- Créer un OAuth 2.0 Client ID (Type: Application Web)
- Ajouter les URIs autorisés:
  - `http://localhost:5173` (développement)
  - Votre domaine de production

3. **Configuration Google Sheets**

- Créer un nouveau Google Sheet
- Créer 4 onglets avec les noms exacts:
  - `Clients`
  - `TypeDePrestation`
  - `Prestation`
  - `Paiement`
- Ajouter les en-têtes de colonnes (ligne 1) selon la structure définie dans `specification.md`

4. **Configuration des variables d'environnement**

Copier `.env.example` vers `.env` et remplir les valeurs:

```bash
cp .env.example .env
```

Modifier `.env` avec vos propres valeurs:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
VITE_SPREADSHEET_ID=your_google_sheet_id
VITE_TEMPLATE_FACTURE_ID=your_facture_template_doc_id
VITE_TEMPLATE_RECU_ID=your_recu_template_doc_id
VITE_DRIVE_FOLDER_FACTURES_ID=your_factures_folder_id
VITE_DRIVE_FOLDER_RECUS_ID=your_recus_folder_id
```

5. **Lancer l'application**

```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

## 📂 Structure du Projet

```
src/
├── components/          # Composants React réutilisables
│   ├── common/         # Composants génériques (Button, Input, Modal...)
│   ├── layout/         # Layout, Sidebar, Header
│   └── forms/          # Formulaires spécifiques
├── pages/              # Pages principales
├── services/           # Services API et logique métier
├── contexts/           # Contexts React (Auth, Data, Notifications)
├── hooks/              # Custom hooks
├── utils/              # Fonctions utilitaires
├── types/              # Types TypeScript
└── constants/          # Constantes
```

## ✅ Fonctionnalités Implémentées

### Phase 1 - Infrastructure (✅ Terminé)

- ✅ Setup projet Vite + React + TypeScript + Tailwind
- ✅ Configuration Google OAuth
- ✅ Structure de dossiers et architecture
- ✅ Types TypeScript complets
- ✅ Utilitaires (formatage dates, montants, validateurs)
- ✅ Service d'authentification Google
- ✅ AuthContext avec gestion de session
- ✅ Service d'intégration Google Sheets
- ✅ Composants UI communs (Button, Input, Modal, Loading, Toast)
- ✅ Système de notifications
- ✅ Layout principal (Header, Sidebar)
- ✅ Page de connexion
- ✅ Routing avec routes protégées
- ✅ Pages placeholder (Dashboard, Clients, Types, Prestations, Paiements)

### Phase 2 - À Implémenter

- ⏳ CRUD complet pour Clients
- ⏳ CRUD complet pour Types de Prestations
- ⏳ CRUD complet pour Prestations
- ⏳ CRUD complet pour Paiements
- ⏳ Tableau de bord avec statistiques
- ⏳ Service de génération de PDFs (factures/reçus)
- ⏳ Filtres et recherche avancés
- ⏳ Graphiques et visualisations

## 🔧 Scripts Disponibles

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build pour la production
npm run preview      # Prévisualiser le build de production
npm run lint         # Linter le code
```

## 📖 Documentation

- Spécifications complètes: `specification.md`
- Types TypeScript: `src/types/index.ts`
- Constantes: `src/constants/index.ts`

## 🔐 Sécurité

- L'authentification utilise Google OAuth 2.0
- Les tokens sont stockés localement dans localStorage
- Les tokens expirent automatiquement après 1 heure
- Validation automatique des tokens au chargement

## 🌐 Déploiement

### Vercel (Recommandé)

1. Push le code sur GitHub
2. Connecter le repository à Vercel
3. Configurer les variables d'environnement dans Vercel
4. Mettre à jour `VITE_GOOGLE_REDIRECT_URI` avec l'URL de production
5. Ajouter l'URL de production dans Google Cloud Console (URIs autorisés)

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Configurer les variables d'environnement
4. Mettre à jour les URIs autorisés dans Google Cloud

## 🐛 Problèmes Connus

- Les templates Google Docs pour factures/reçus doivent être créés manuellement
- Le service de génération de PDF n'est pas encore implémenté
- Les pages CRUD sont des placeholders

## 📝 Notes de Développement

### Formats de Données

- **Dates**: Stockage en `YYYY-MM-DD`, affichage en `DD/MM/YYYY`
- **Montants**: Stockage en décimal, affichage en format français `1 234,56 €`
- **IDs Paiement**: Format `yymmddnnnn` (ex: 2603150001)

### API Google Sheets

- Les données commencent à la ligne 2 (ligne 1 = en-têtes)
- Chaque onglet correspond à une table
- Les modifications sont synchrones avec Google Sheets

## 👤 Auteur

ComptaClaude - Application développée avec Claude Code

## 📄 Licence

Propriétaire - Tous droits réservés
