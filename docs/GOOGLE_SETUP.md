# 🔧 Configuration Google Cloud - Guide Complet

## Pourquoi Cette Erreur ?

L'erreur **"400. That's an error."** de Google signifie que :
- ❌ Le Client ID n'est pas configuré
- ❌ Les URIs de redirection ne sont pas autorisés
- ❌ Le projet Google Cloud n'est pas configuré

## 📋 Étapes de Configuration (15 min)

### **Étape 1: Créer un Projet Google Cloud** ☁️

1. **Aller sur Google Cloud Console**
   - Ouvrir : https://console.cloud.google.com/

2. **Créer un nouveau projet**
   - Cliquer sur le sélecteur de projet (en haut)
   - Cliquer "NOUVEAU PROJET"
   - Nom : `ComptaClaude` (ou autre)
   - Cliquer "CRÉER"
   - Attendre la création (30 secondes)
   - Sélectionner le projet créé

### **Étape 2: Activer les APIs** 🔌

1. **Dans le menu de gauche** :
   - Aller dans "APIs et services" > "Bibliothèque"

2. **Activer ces 3 APIs** (une par une):

   **a) Google Sheets API**
   - Rechercher : "Google Sheets API"
   - Cliquer dessus
   - Cliquer "ACTIVER"
   - Attendre l'activation

   **b) Google Docs API**
   - Rechercher : "Google Docs API"
   - Cliquer dessus
   - Cliquer "ACTIVER"

   **c) Google Drive API**
   - Rechercher : "Google Drive API"
   - Cliquer dessus
   - Cliquer "ACTIVER"

### **Étape 3: Configurer l'Écran de Consentement OAuth** 🔐

1. **Aller dans "APIs et services" > "Écran de consentement OAuth"**

2. **Sélectionner le type d'utilisateur**
   - Choisir : **"Externe"**
   - Cliquer "CRÉER"

3. **Informations sur l'application**
   - Nom de l'application : `ComptaClaude`
   - E-mail assistance utilisateur : (votre email)
   - Logo : (optionnel, laisser vide)
   - Domaine de l'application : (laisser vide)
   - E-mail du développeur : (votre email)
   - Cliquer "ENREGISTRER ET CONTINUER"

4. **Champs d'application (Scopes)**
   - Cliquer "AJOUTER OU SUPPRIMER DES CHAMPS D'APPLICATION"
   - Rechercher et cocher ces 3 scopes :
     - ✅ `.../auth/spreadsheets` - Voir, modifier, créer et supprimer vos fichiers Google Sheets
     - ✅ `.../auth/documents` - Voir, modifier, créer et supprimer vos documents Google Docs
     - ✅ `.../auth/drive.file` - Afficher et gérer les fichiers Google Drive créés par cette application
   - Cliquer "METTRE À JOUR"
   - Cliquer "ENREGISTRER ET CONTINUER"

5. **Utilisateurs de test**
   - Cliquer "+ AJOUTER DES UTILISATEURS"
   - Ajouter votre email (celui que vous utiliserez pour vous connecter)
   - Cliquer "AJOUTER"
   - Cliquer "ENREGISTRER ET CONTINUER"

6. **Résumé**
   - Vérifier les informations
   - Cliquer "RETOUR AU TABLEAU DE BORD"

### **Étape 4: Créer les Identifiants OAuth** 🔑

1. **Aller dans "APIs et services" > "Identifiants"**

2. **Créer les identifiants**
   - Cliquer "+ CRÉER DES IDENTIFIANTS"
   - Sélectionner "ID client OAuth"

3. **Configuration de l'ID client OAuth**
   - Type d'application : **"Application Web"**
   - Nom : `ComptaClaude Web Client`

4. **URIs de redirection autorisés** ⚠️ IMPORTANT

   Cliquer "+ AJOUTER UN URI" et ajouter **UNIQUEMENT** :
   ```
   http://localhost:5173
   ```

   ⚠️ **IMPORTANT**:
   - Google OAuth **N'ACCEPTE PAS** les URIs basées sur des IPs (192.168.x.x)
   - Seul `localhost` fonctionne pour le développement local
   - Pour tester sur mobile avec OAuth, voir `MOBILE_TEST_NGROK.md`
   - Pour tester le responsive, utiliser DevTools du navigateur (Ctrl+Shift+M)

5. **Origines JavaScript autorisées** (optionnel mais recommandé)

   Cliquer "+ AJOUTER UN URI" et ajouter :
   ```
   http://localhost:5173
   ```

6. **Créer**
   - Cliquer "CRÉER"
   - Une popup s'affiche avec votre Client ID

7. **Copier le Client ID** 📋
   - Copier l'ID (ressemble à : `123456789-abc...xyz.apps.googleusercontent.com`)
   - **NE PAS** copier le "Secret client" (on n'en a pas besoin)

### **Étape 5: Créer le Google Sheet** 📊

1. **Créer un nouveau Google Sheet**
   - Aller sur : https://sheets.google.com
   - Cliquer "Vierge" (nouveau document)
   - Nommer : "ComptaClaude - Données"

2. **Créer les 4 onglets**

   **a) Onglet "Clients"**
   - Renommer l'onglet par défaut en "Clients"
   - Dans la **ligne 1**, écrire les en-têtes :
     ```
     A1: nom
     B1: email
     C1: telephone
     D1: adresse
     E1: numero_siret
     ```

   **b) Onglet "TypeDePrestation"**
   - Cliquer "+" en bas pour créer un nouvel onglet
   - Renommer en "TypeDePrestation" (exactement ce nom)
   - En-têtes ligne 1 :
     ```
     A1: nom
     B1: montant_suggere
     ```

   **c) Onglet "Prestation"**
   - Créer un nouvel onglet
   - Renommer en "Prestation"
   - En-têtes ligne 1 :
     ```
     A1: date
     B1: nom_client
     C1: type_prestation
     D1: montant
     E1: paiement_id
     ```

   **d) Onglet "Paiement"**
   - Créer un nouvel onglet
   - Renommer en "Paiement"
   - En-têtes ligne 1 :
     ```
     A1: reference
     B1: client
     C1: total
     D1: date_encaissement
     E1: mode_encaissement
     F1: facture
     G1: recu
     ```

3. **Copier l'ID du Google Sheet** 📋
   - L'ID est dans l'URL : `https://docs.google.com/spreadsheets/d/{ID}/edit`
   - Exemple : Si l'URL est `https://docs.google.com/spreadsheets/d/1ABC-xyz123/edit`
   - Alors l'ID est : `1ABC-xyz123`
   - Copier cet ID

### **Étape 6: Configurer l'Application** ⚙️

1. **Créer le fichier .env**
   ```bash
   cp .env.example .env
   ```

2. **Éditer le fichier .env**
   ```bash
   # Ouvrir avec votre éditeur
   # Sur Mac: open .env
   # Sur Windows: notepad .env
   ```

3. **Remplir les valeurs**
   ```env
   # Coller votre Client ID (étape 4.7)
   VITE_GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com

   # URI de redirection (localhost pour dev)
   VITE_GOOGLE_REDIRECT_URI=http://localhost:5173

   # ID de votre Google Sheet (étape 5.3)
   VITE_SPREADSHEET_ID=1ABC-xyz123

   # Pour l'instant, laisser ces valeurs par défaut
   # (on les configurera plus tard pour les PDFs)
   VITE_TEMPLATE_FACTURE_ID=dummy_value
   VITE_TEMPLATE_RECU_ID=dummy_value
   VITE_DRIVE_FOLDER_FACTURES_ID=dummy_value
   VITE_DRIVE_FOLDER_RECUS_ID=dummy_value
   ```

4. **Sauvegarder le fichier .env**

### **Étape 7: Redémarrer le Serveur** 🔄

1. **Arrêter le serveur** (Ctrl+C dans le terminal)

2. **Redémarrer**
   ```bash
   npm run dev
   ```

3. **Ouvrir l'application**
   ```
   http://localhost:5173
   ```

4. **Tester la connexion**
   - Cliquer "Se connecter avec Google"
   - Sélectionner votre compte Google
   - Accepter les permissions demandées
   - Vous devriez être redirigé vers le Dashboard !

---

## ✅ Checklist de Vérification

Avant de tester, vérifier que :

- [ ] Projet Google Cloud créé
- [ ] 3 APIs activées (Sheets, Docs, Drive)
- [ ] Écran de consentement configuré
- [ ] Votre email ajouté comme utilisateur test
- [ ] Client ID OAuth créé
- [ ] **URIs de redirection ajoutés** (`http://localhost:5173`)
- [ ] Google Sheet créé avec 4 onglets
- [ ] En-têtes corrects dans chaque onglet
- [ ] Fichier .env créé et rempli
- [ ] Client ID copié dans .env
- [ ] Sheet ID copié dans .env
- [ ] Serveur redémarré

---

## 🐛 Problèmes Fréquents

### Erreur 400 "redirect_uri_mismatch"
**Cause**: L'URI de redirection ne correspond pas
**Solution**:
1. Vérifier dans Google Cloud Console > Identifiants
2. S'assurer que `http://localhost:5173` est dans les URIs autorisés
3. Pas d'espace, pas de slash final
4. Redémarrer le serveur après modification

### Erreur "access_denied"
**Cause**: Votre compte n'est pas dans les utilisateurs test
**Solution**:
1. Google Cloud Console > APIs et services > Écran de consentement OAuth
2. Section "Utilisateurs de test"
3. Ajouter votre email
4. Réessayer

### Erreur "invalid_client"
**Cause**: Client ID incorrect dans .env
**Solution**:
1. Vérifier le Client ID dans Google Cloud Console > Identifiants
2. Le copier à nouveau dans .env
3. Redémarrer le serveur

### Page blanche après connexion
**Cause**: Problème de redirection
**Solution**:
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs
3. Vérifier que VITE_GOOGLE_REDIRECT_URI dans .env correspond à l'URL actuelle

---

## 📱 Pour Tester sur Mobile

⚠️ **Google OAuth ne fonctionne PAS avec des URIs basées sur des IPs**

### Option 1: DevTools (Recommandé pour Dev) ⭐

**Le plus simple** : Tester le responsive sur desktop avec DevTools
1. Ouvrir `http://localhost:5173`
2. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
3. Sélectionner iPhone, iPad, etc.
4. **OAuth fonctionne** car vous êtes sur localhost
5. Tester toutes les fonctionnalités

✅ **Avantages** :
- Rapide et efficace
- OAuth fonctionne
- Simule parfaitement les mobiles
- Pas de configuration supplémentaire

### Option 2: ngrok pour Vrai Test Mobile

Si vous voulez tester sur votre **vrai téléphone** avec OAuth :
- Voir le guide complet : **`MOBILE_TEST_NGROK.md`**
- Utilise un tunnel HTTPS avec un vrai domaine
- OAuth fonctionne sur mobile
- Plus complexe mais possible

---

## ⏱️ Temps Total Estimé

- Étape 1-2: 5 min (création projet + APIs)
- Étape 3: 3 min (écran de consentement)
- Étape 4: 2 min (OAuth Client ID)
- Étape 5: 3 min (Google Sheet)
- Étape 6-7: 2 min (configuration app)

**Total : ~15 minutes** ⏰

---

## 🎉 Après Configuration

Une fois configuré, vous pourrez :
- ✅ Se connecter avec votre compte Google
- ✅ Gérer vos clients
- ✅ Voir les données synchronisées dans Google Sheets
- ✅ Ajouter, modifier, supprimer des clients
- ✅ Tout est sauvegardé automatiquement !

**Bon courage avec la configuration !** 🚀
