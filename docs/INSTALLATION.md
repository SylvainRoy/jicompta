# Installation de ComptaClaude

Ce guide explique comment installer et configurer ComptaClaude pour un déploiement multi-utilisateurs.

## 📋 Prérequis

- Node.js 18+ et npm
- Un projet Google Cloud avec OAuth 2.0 configuré
- Les API suivantes activées dans Google Cloud Console:
  - Google Sheets API
  - Google Docs API
  - Google Drive API

## 🚀 Installation pour développement

### 1. Cloner le repository

```bash
git clone <repository-url>
cd comptaclaude
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs nécessaires:
   - Google Sheets API
   - Google Docs API
   - Google Drive API
4. Configurez l'écran de consentement OAuth
5. Créez des identifiants OAuth 2.0:
   - Type: Application Web
   - Origines JavaScript autorisées: `http://localhost:5173`
   - URI de redirection: `http://localhost:5173`
6. Copiez le Client ID

### 4. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet:

```bash
cp .env.example .env
```

Modifiez `.env` et remplacez `VITE_GOOGLE_CLIENT_ID` par votre Client ID:

```env
VITE_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
```

**C'est tout!** Aucune autre configuration manuelle n'est nécessaire.

### 5. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 👤 Premier utilisateur

### Flux d'utilisation

1. **Connexion**: L'utilisateur clique sur "Se connecter avec Google"
2. **Autorisation**: Google demande les permissions (Sheets, Docs, Drive)
3. **Setup automatique**: Un wizard apparaît et crée automatiquement:
   - Un dossier `Comptabilite/` dans Google Drive
   - Un tableur `Comptabilite/Compta` avec 4 onglets (Clients, TypesPrestations, Prestations, Paiements)
   - Des modèles dans `Comptabilite/Modeles/`:
     - Modèle de Facture (personnalisable)
     - Modèle de Reçu (personnalisable)
   - Des sous-dossiers:
     - `Comptabilite/Factures/` (pour les factures générées)
     - `Comptabilite/Recus/` (pour les reçus générés)
4. **Configuration locale**: Les IDs des ressources créées sont stockés dans le localStorage du navigateur
5. **Prêt**: L'utilisateur est redirigé vers le tableau de bord

**Durée totale**: ~10-15 secondes

### Personnalisation des templates

Après le setup, l'utilisateur peut personnaliser ses templates:

1. Aller dans "Paramètres"
2. Cliquer sur "Ouvrir" à côté de "Modèle de Facture" ou "Modèle de Reçu"
3. Modifier le modèle dans Google Docs (formatage, logo, informations légales, etc.)
4. Sauvegarder - les changements seront appliqués aux prochaines factures/reçus

## 🌐 Déploiement en production

### Option 1: Vercel (recommandé)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Connectez votre repository GitHub
3. Configurez les variables d'environnement:
   - `VITE_GOOGLE_CLIENT_ID`: Votre Client ID
4. Mettez à jour les origines autorisées dans Google Cloud Console:
   - Ajoutez votre domaine Vercel (ex: `https://comptaclaude.vercel.app`)
5. Déployez!

### Option 2: Netlify

1. Créez un compte sur [Netlify](https://netlify.com)
2. Connectez votre repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Configurez la variable d'environnement:
   - `VITE_GOOGLE_CLIENT_ID`: Votre Client ID
6. Mettez à jour Google Cloud Console avec votre domaine Netlify

### Option 3: Serveur personnalisé

```bash
# Build de production
npm run build

# Les fichiers statiques sont dans ./dist
# Servez-les avec nginx, Apache, ou tout autre serveur web
```

**Important**: Mettez à jour les origines autorisées dans Google Cloud Console avec votre domaine de production.

## 🔧 Configuration avancée

### Réinitialiser la configuration

Si un utilisateur rencontre des problèmes:

1. Aller dans "Paramètres"
2. Cliquer sur "Réinitialiser la configuration"
3. Une nouvelle configuration sera créée (les anciennes ressources restent dans Drive)

### Effacer la configuration locale

Pour forcer le wizard au prochain login:

1. Aller dans "Paramètres"
2. Cliquer sur "Effacer la configuration locale"
3. Le wizard réapparaîtra à la prochaine connexion

### Changement de navigateur

Si un utilisateur change de navigateur ou d'appareil:

- Le wizard se lancera automatiquement au premier login
- Il détectera si une configuration existe déjà dans Drive
- Si oui, il la chargera automatiquement
- Si non, il créera une nouvelle configuration

## 🔒 Sécurité et confidentialité

### Données utilisateur

- **Stockage**: Toutes les données sont stockées dans le Google Drive personnel de l'utilisateur
- **Configuration**: Les IDs des ressources sont stockés localement (localStorage)
- **Pas de backend**: L'application ne stocke aucune donnée sur un serveur tiers
- **Permissions**: L'application demande uniquement les permissions nécessaires (Sheets, Docs, Drive)

### Multi-utilisateurs

- Chaque utilisateur a ses propres ressources Google Drive
- Aucune donnée n'est partagée entre utilisateurs
- Chaque utilisateur doit se connecter avec son propre compte Google

## 📚 Documentation additionnelle

- [Google Setup Guide](./GOOGLE_SETUP.md) - Configuration détaillée de Google Cloud
- [Templates Setup](./TEMPLATES_SETUP.md) - Variables disponibles dans les templates
- [Mobile Testing](./MOBILE_TEST_NGROK.md) - Tester sur mobile avec ngrok
- [Progress](./PROGRESS.md) - État d'avancement du projet

## 🆘 Dépannage

### "Configuration not found"

- Vérifiez que vous êtes bien connecté
- Allez dans Paramètres et cliquez sur "Réinitialiser la configuration"

### "Drive API error: 404"

- Vérifiez que les APIs sont bien activées dans Google Cloud Console
- Vérifiez que les permissions OAuth incluent bien `drive` (pas seulement `drive.file`)

### Le wizard ne se lance pas

- Effacez le localStorage du navigateur
- Reconnectez-vous

### Les templates ne fonctionnent pas

- Vérifiez dans Paramètres que les IDs des templates sont bien configurés
- Ouvrez les templates via Paramètres et vérifiez qu'ils contiennent les placeholders `{{VARIABLE}}`
- Si nécessaire, réinitialisez la configuration

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
