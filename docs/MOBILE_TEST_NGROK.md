# 📱 Test sur Mobile avec ngrok

## Pourquoi ngrok ?

Google OAuth n'accepte pas les IPs (192.168.x.x) comme URIs de redirection.
ngrok crée un tunnel HTTPS avec un vrai domaine qui fonctionne avec Google OAuth.

## 🚀 Installation et Configuration (10 min)

### Étape 1: Installer ngrok

**Mac (avec Homebrew)** :
```bash
brew install ngrok/ngrok/ngrok
```

**Ou téléchargement direct** :
1. Aller sur : https://ngrok.com/download
2. Télécharger pour votre OS
3. Extraire et déplacer dans /usr/local/bin

### Étape 2: Créer un Compte (Gratuit)

1. Aller sur : https://dashboard.ngrok.com/signup
2. S'inscrire (gratuit)
3. Copier votre authtoken

### Étape 3: Authentifier ngrok

```bash
ngrok config add-authtoken VOTRE_TOKEN
```

### Étape 4: Démarrer le Serveur Local

Dans un terminal :
```bash
npm run dev
# Le serveur démarre sur http://localhost:5173
```

### Étape 5: Créer le Tunnel ngrok

Dans un **nouveau terminal** :
```bash
ngrok http 5173
```

Vous verrez :
```
Session Status                online
Account                       votre-email
Forwarding                    https://abc123.ngrok.io -> http://localhost:5173
```

**Copier l'URL HTTPS** : `https://abc123.ngrok.io`

### Étape 6: Ajouter l'URI dans Google Cloud

1. **Google Cloud Console** > APIs et services > Identifiants
2. Cliquer sur votre Client OAuth
3. **URIs de redirection autorisés**, ajouter :
   ```
   https://abc123.ngrok.io
   ```
   ⚠️ Remplacer `abc123` par votre vraie URL ngrok

4. **Origines JavaScript autorisées**, ajouter :
   ```
   https://abc123.ngrok.io
   ```

5. Cliquer **ENREGISTRER**

### Étape 7: Mettre à Jour .env

```bash
# Éditer .env
```

**Changer temporairement** :
```env
VITE_GOOGLE_REDIRECT_URI=https://abc123.ngrok.io
```

### Étape 8: Redémarrer le Serveur

```bash
# Ctrl+C pour arrêter
npm run dev
```

### Étape 9: Tester !

**Sur votre téléphone** :
1. Ouvrir : `https://abc123.ngrok.io`
2. La page se charge
3. Cliquer "Se connecter avec Google"
4. OAuth fonctionne !
5. Tester l'application normalement

**Sur desktop aussi** :
- Ouvrir : `https://abc123.ngrok.io`
- Tout fonctionne pareil

---

## ⚠️ Limitations Version Gratuite

- URL change à chaque redémarrage de ngrok
- Session limitée à 8 heures
- 1 tunnel à la fois

**Solution** : À chaque fois que l'URL change, mettre à jour :
1. Les URIs dans Google Cloud Console
2. Le .env (VITE_GOOGLE_REDIRECT_URI)
3. Redémarrer le serveur

---

## 🎯 Workflow de Dev Recommandé

### Pour le développement normal :
```env
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
```
```bash
npm run dev
# Tester sur http://localhost:5173
# Utiliser DevTools pour responsive
```

### Pour tester sur vrai mobile :
```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 5173
# Copier l'URL ngrok

# Mettre à jour Google Cloud URIs
# Mettre à jour .env
# Redémarrer npm run dev

# Tester sur téléphone avec l'URL ngrok
```

---

## 💡 Alternative: DevTools = 95% Suffisant

**Pour le développement quotidien**, les DevTools de Chrome/Firefox suffisent :
- ✅ Simulent parfaitement les mobiles
- ✅ Touch events
- ✅ Tailles d'écran exactes
- ✅ Rotation
- ✅ Throttling réseau
- ✅ Plus rapide que vrai device

**Utiliser ngrok seulement pour** :
- Tester les vraies performances
- Tester la vraie ergonomie touch
- Démos client
- Tests finaux avant production
