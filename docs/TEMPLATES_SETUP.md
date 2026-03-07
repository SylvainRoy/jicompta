# Configuration des Templates PDF (Factures et Reçus)

Ce guide explique comment configurer les templates Google Docs pour générer les factures et reçus.

## 📁 Étape 1 : Créer la structure de dossiers dans Google Drive

1. Allez sur [Google Drive](https://drive.google.com)
2. Créez la structure suivante :

```
Mon Drive/
└── Comptabilité/
    ├── Templates/
    ├── Factures/
    │   ├── 2025/
    │   └── 2026/
    └── Reçus/
        ├── 2025/
        └── 2026/
```

3. **Récupérer les IDs des dossiers** :
   - Ouvrez chaque dossier dans votre navigateur
   - L'URL ressemble à : `https://drive.google.com/drive/folders/XXXXX`
   - Copiez la partie `XXXXX` (l'ID du dossier)
   - Notez :
     - ID du dossier `Factures/` → Pour `VITE_DRIVE_FOLDER_FACTURES_ID`
     - ID du dossier `Reçus/` → Pour `VITE_DRIVE_FOLDER_RECUS_ID`

## 📄 Étape 2 : Créer le Template de Facture

1. Créez un nouveau **Google Docs** dans le dossier `Templates/`
2. Nommez-le : `Template_Facture`
3. Copiez-collez le contenu suivant :

```
===========================================
            FACTURE
===========================================

Référence : {{REFERENCE_PAIEMENT}}
Date : {{DATE_FACTURE}}

-------------------------------------------
CLIENT
-------------------------------------------

Nom : {{NOM_CLIENT}}
Email : {{EMAIL_CLIENT}}
Téléphone : {{TELEPHONE_CLIENT}}
Adresse : {{ADRESSE_CLIENT}}
SIRET : {{SIRET_CLIENT}}

-------------------------------------------
DÉTAIL DES PRESTATIONS
-------------------------------------------

{{LISTE_PRESTATIONS}}

-------------------------------------------
TOTAL : {{TOTAL}}
-------------------------------------------

Mode d'encaissement : {{MODE_ENCAISSEMENT}}
Date d'encaissement : {{DATE_ENCAISSEMENT}}

Merci de votre confiance !
```

4. **Personnalisez** le template selon vos besoins (logo, mentions légales, etc.)
5. **Important** : Gardez tous les `{{PLACEHOLDERS}}` exactement comme indiqué
6. **Récupérer l'ID du template** :
   - URL : `https://docs.google.com/document/d/YYYYY/edit`
   - Copiez la partie `YYYYY` → Pour `VITE_TEMPLATE_FACTURE_ID`

## 📄 Étape 3 : Créer le Template de Reçu

1. Créez un nouveau **Google Docs** dans le dossier `Templates/`
2. Nommez-le : `Template_Recu`
3. Copiez-collez le contenu suivant :

```
===========================================
            REÇU
===========================================

Référence : {{REFERENCE_PAIEMENT}}
Date de génération : {{DATE_FACTURE}}
Date d'encaissement : {{DATE_ENCAISSEMENT}}

-------------------------------------------
CLIENT
-------------------------------------------

Nom : {{NOM_CLIENT}}
Email : {{EMAIL_CLIENT}}
Téléphone : {{TELEPHONE_CLIENT}}
Adresse : {{ADRESSE_CLIENT}}
SIRET : {{SIRET_CLIENT}}

-------------------------------------------
DÉTAIL DES PRESTATIONS
-------------------------------------------

{{LISTE_PRESTATIONS}}

-------------------------------------------
Mode de paiement : {{MODE_ENCAISSEMENT}}
TOTAL ENCAISSÉ : {{TOTAL}}
-------------------------------------------

Merci de votre paiement !
```

4. **Personnalisez** le template selon vos besoins
5. **Important** : Gardez tous les `{{PLACEHOLDERS}}` exactement comme indiqué
6. **Récupérer l'ID du template** :
   - URL : `https://docs.google.com/document/d/ZZZZZ/edit`
   - Copiez la partie `ZZZZZ` → Pour `VITE_TEMPLATE_RECU_ID`

## ⚙️ Étape 4 : Configuration dans .env

Ajoutez les IDs récupérés dans votre fichier `.env` :

```bash
# Google Docs Templates
VITE_TEMPLATE_FACTURE_ID=YYYYY_from_step_2
VITE_TEMPLATE_RECU_ID=ZZZZZ_from_step_3

# Google Drive Folders
VITE_DRIVE_FOLDER_FACTURES_ID=XXXXX_factures_folder
VITE_DRIVE_FOLDER_RECUS_ID=XXXXX_recus_folder
```

## 🔐 Étape 5 : Permissions (Important !)

Les templates et dossiers doivent être **accessibles** avec votre compte Google :

1. **Vérifiez les permissions** :
   - Ouvrez chaque template et dossier
   - Cliquez sur "Partager"
   - Votre compte Google doit avoir accès "Éditeur" ou "Propriétaire"

2. **Note** : L'application utilise votre token OAuth, donc tout ce qui est accessible depuis votre compte Google sera accessible à l'application.

## 🎨 Personnalisation Avancée

### Variables disponibles pour FACTURES et REÇUS (toutes disponibles pour les deux) :

**Informations Paiement :**
- `{{REFERENCE_PAIEMENT}}` - ID du paiement (ex: 2603150001)
- `{{DATE_FACTURE}}` - Date de génération du document (format: DD/MM/YYYY)
- `{{DATE_ENCAISSEMENT}}` - Date d'encaissement (ou "Non encaissé" si pas encore encaissé)
- `{{MODE_ENCAISSEMENT}}` - Mode de paiement (Virement, Espèce, Chèque, PayPal, Autre ou "Non spécifié")
- `{{TOTAL}}` - Montant total (format: 1 234,56 €)

**Informations Client :**
- `{{NOM_CLIENT}}` - Nom du client
- `{{EMAIL_CLIENT}}` - Email du client
- `{{TELEPHONE_CLIENT}}` - Téléphone du client (ou "Non renseigné")
- `{{ADRESSE_CLIENT}}` - Adresse complète (ou "Non renseignée")
- `{{SIRET_CLIENT}}` - Numéro SIRET (ou "Non renseigné")

**Détails :**
- `{{LISTE_PRESTATIONS}}` - Tableau des prestations (date, type, montant)

### Conseils de mise en forme :

- Utilisez **Gras** pour les titres
- Utilisez des **tableaux** pour `{{LISTE_PRESTATIONS}}` (optionnel)
- Ajoutez votre **logo** en haut du document
- Ajoutez vos **mentions légales** en bas
- Utilisez des **couleurs** pour rendre le document plus professionnel

## ✅ Étape 6 : Tester la génération

1. Redémarrez votre serveur de développement (pour charger les nouvelles variables d'environnement)
2. Créez un paiement dans l'application
3. Cliquez sur "Générer facture"
4. Vérifiez que :
   - Le document est créé dans le bon dossier Drive
   - Toutes les variables sont remplacées
   - Le PDF est accessible via le lien

## ❓ Dépannage

### Erreur : "Template ... ID not configured"
- Vérifiez que les IDs sont bien dans le fichier `.env`
- Redémarrez le serveur après modification du `.env`

### Erreur : "Drive API error: 404"
- Les IDs de template ou dossier sont incorrects
- Vérifiez les permissions (votre compte doit avoir accès)

### Erreur : "Cannot generate reçu: payment not yet encaissé"
- Le reçu ne peut être généré que pour les paiements encaissés
- Ajoutez une date d'encaissement au paiement d'abord

### Les variables ne sont pas remplacées
- Vérifiez que les placeholders sont **exactement** comme indiqué (majuscules, accolades)
- Exemple correct : `{{TOTAL}}`
- Exemple incorrect : `{{ TOTAL }}` ou `{{total}}`

## 📚 Ressources

- [Documentation Google Docs API](https://developers.google.com/docs/api)
- [Documentation Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
