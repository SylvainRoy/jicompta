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
- Ajouter `http://localhost:5173` dans les URIs autorisés
- Copier le Client ID

3. **Configurer l'environnement**

```bash
cp .env.example .env
```

Modifier `.env` avec votre Client ID:

```env
VITE_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
```

> **⚠️ Important**: C'est le **seul** ID nécessaire! Tous les autres IDs (spreadsheet, templates, dossiers) sont créés et gérés automatiquement par l'application.

**C'est tout!** Lancez l'application:

```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

## 👤 Première utilisation

### Configuration automatique

1. **Connexion**: Cliquez sur "Se connecter avec Google" et autorisez les permissions

2. **Détection automatique**: L'application cherche dans votre Google Drive:
   - ✅ **Configuration existante trouvée**: Chargement automatique de votre espace
   - 🆕 **Nouveau compte**: Le Setup Wizard se lance

3. **Setup Wizard** (uniquement pour les nouveaux comptes):
   - Création du dossier `Comptabilite/` dans votre Drive
   - Création du tableur `Compta` avec 4 onglets (Clients, TypeDePrestation, Prestation, Paiement)
   - Création des modèles de documents dans `Comptabilite/Modeles/`
     - `Modèle de Facture` (personnalisable)
     - `Modèle de Reçu` (personnalisable)
   - Création des dossiers `Comptabilite/Factures/` et `Comptabilite/Recus/`
   - **Durée**: ~10-15 secondes

4. **C'est prêt!** → Redirection automatique vers le tableau de bord

### 📱 Support multi-appareils

L'application fonctionne **automatiquement sur tous vos appareils**:

- **Ordinateur de bureau** → Connectez-vous avec Google → Vos données sont là!
- **Téléphone** → Connectez-vous avec Google → Vos données sont là!
- **Ordinateur du travail** → Connectez-vous avec Google → Vos données sont là!

**Aucune synchronisation manuelle nécessaire**: Tout est dans votre Google Drive.

### 🔄 Comment ça marche ?

1. Lors de la connexion, l'application cherche un dossier `Comptabilite/` dans votre Drive
2. Si trouvé → Charge automatiquement la configuration (IDs des fichiers)
3. Si absent → Lance le wizard pour créer la structure
4. La configuration est stockée dans le navigateur (localStorage) pour accès rapide
5. Sur un nouvel appareil → Détection automatique à nouveau

> **Note**: Si vous videz le cache du navigateur, pas de panique! L'application recherchera automatiquement votre configuration dans Drive.

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
- **Configuration automatique**:
  - Les IDs des fichiers sont découverts automatiquement dans Drive
  - Stockés localement dans le navigateur (localStorage) pour performance
  - Re-détectés automatiquement si le cache est vidé
- **OAuth sécurisé**: Authentification via Google OAuth 2.0
- **Multi-utilisateurs**: Isolation complète entre utilisateurs
  - Chaque utilisateur a son propre dossier `Comptabilite/` dans son Drive
  - Aucune interaction possible entre comptes
  - Un seul Client ID partagé (côté développeur), données séparées (côté utilisateur)

## 🎉 Améliorations récentes (Mars 2026)

### Industrialisation complète

L'application a été entièrement industrialisée pour simplifier l'installation et l'utilisation:

- ✅ **Setup entièrement automatique**: Plus besoin de créer manuellement des fichiers dans Drive
- ✅ **Un seul ID requis**: Seul le `VITE_GOOGLE_CLIENT_ID` est nécessaire dans `.env`
- ✅ **Détection automatique**: Trouve et charge automatiquement la configuration existante
- ✅ **Support multi-appareils**: Fonctionne sur tous les appareils sans configuration
- ✅ **Noms français**: Tous les dossiers et fichiers en français (Comptabilite, Modeles, etc.)
- ✅ **Gestion des prestations**: Distinction correcte entre prestations liées et prestations payées

### Migration depuis une version précédente

Si vous utilisez une ancienne version avec configuration manuelle:

1. Les anciennes configurations continuent de fonctionner
2. Pour bénéficier de la détection automatique:
   - Assurez-vous que votre dossier s'appelle `Comptabilite/`
   - Votre tableur doit s'appeler `Compta`
   - Vos templates doivent être dans `Comptabilite/Modeles/`
3. Videz le localStorage du navigateur pour forcer la re-détection

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
