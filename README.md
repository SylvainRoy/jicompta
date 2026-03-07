# ComptaClaude

Application de gestion comptable pour petites entreprises françaises avec configuration automatique.

## ✨ Caractéristiques principales

- **Configuration automatique**: Setup complet en 10 secondes via un wizard interactif
- **Multi-utilisateurs**: Chaque utilisateur a ses propres données dans son Google Drive
- **Génération de PDF**: Factures et reçus générés automatiquement avec templates personnalisables
- **Mobile-first**: Interface responsive optimisée pour smartphones et tablettes
- **Sans backend**: Toutes les données restent dans Google Drive de l'utilisateur

## 🚀 Technologies

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **State Management**: React Context API + Hooks
- **APIs**: Google OAuth 2.0, Google Sheets, Google Docs, Google Drive

## 📦 Installation rapide

### Prérequis

- Node.js 18+ et npm
- Un compte Google Cloud avec OAuth 2.0 configuré

### Installation en 3 étapes

1. **Cloner et installer**

```bash
git clone <repository-url>
cd comptaclaude
npm install
```

2. **Configurer Google OAuth**

- Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
- Activer les APIs: Google Sheets, Google Docs, Google Drive
- Créer un OAuth 2.0 Client ID (Application Web)
- Copier le Client ID

3. **Configurer l'environnement**

```bash
cp .env.example .env
```

Modifier `.env` avec votre Client ID:

```env
VITE_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
```

**C'est tout!** Lancez l'application:

```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

## 👤 Premier utilisateur

1. Cliquez sur "Se connecter avec Google"
2. Autorisez les permissions
3. Le **Setup Wizard** crée automatiquement:
   - Un tableur ComptaClaude dans votre Drive
   - Des templates de factures et reçus personnalisables
   - Une structure de dossiers organisée
4. Vous êtes prêt à utiliser l'application!

**Durée totale**: ~10-15 secondes

Consultez [INSTALLATION.md](./docs/INSTALLATION.md) pour plus de détails.

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

## ✅ Fonctionnalités

### Infrastructure et Configuration (✅ Complet)

- ✅ Setup automatique via wizard interactif
- ✅ Création automatique du spreadsheet et des templates
- ✅ Configuration stockée en localStorage
- ✅ Détection et chargement de configuration existante
- ✅ Page Paramètres pour gérer la configuration
- ✅ Google OAuth 2.0 avec gestion de session
- ✅ Système de notifications toast

### Gestion des données (✅ Complet)

- ✅ **Clients**: CRUD complet avec validation
- ✅ **Types de Prestations**: CRUD complet avec montants suggérés
- ✅ **Prestations**: CRUD complet avec calcul automatique des statuts
- ✅ **Paiements**: CRUD complet avec liens vers prestations
- ✅ Filtres et recherche sur toutes les pages
- ✅ Intégration Google Sheets en temps réel

### Génération de documents (✅ Complet)

- ✅ Génération automatique de factures en PDF
- ✅ Génération automatique de reçus en PDF
- ✅ Templates personnalisables dans Google Docs
- ✅ Stockage organisé par année dans Google Drive
- ✅ Variables dynamiques (client, montant, date, etc.)
- ✅ Boutons contextuels (Générer/Voir selon l'état)
- ✅ Indicateurs de chargement pendant la génération

### Interface utilisateur (✅ Complet)

- ✅ Design mobile-first responsive
- ✅ Vue carte (mobile) et tableau (desktop)
- ✅ Navigation intuitive avec sidebar
- ✅ Tableau de bord avec statistiques et graphiques
- ✅ Formulaires avec validation en temps réel
- ✅ Modales pour création/édition
- ✅ États de chargement et messages d'erreur

## 🔧 Scripts Disponibles

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build pour la production
npm run preview      # Prévisualiser le build de production
npm run lint         # Linter le code
```

## 📖 Documentation

- [Installation complète](./docs/INSTALLATION.md) - Guide d'installation détaillé
- [Configuration Google](./docs/GOOGLE_SETUP.md) - Setup Google Cloud Console
- [Templates](./docs/TEMPLATES_SETUP.md) - Variables disponibles pour factures/reçus
- [Test mobile](./docs/MOBILE_TEST_NGROK.md) - Tester sur mobile avec ngrok
- [Spécifications](./docs/specification.md) - Spécifications fonctionnelles complètes
- [Progression](./docs/PROGRESS.md) - État d'avancement du projet

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

## 🔐 Sécurité et Confidentialité

- **Aucun backend**: L'application ne stocke aucune donnée sur un serveur tiers
- **Données personnelles**: Tout reste dans le Google Drive de l'utilisateur
- **Configuration locale**: Les IDs sont stockés uniquement dans le navigateur
- **OAuth sécurisé**: Authentification via Google OAuth 2.0
- **Multi-utilisateurs**: Isolation complète entre utilisateurs

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
