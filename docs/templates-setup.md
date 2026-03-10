# PDF Templates Configuration (Invoices and Receipts)

This guide explains how to configure Google Docs templates to generate invoices and receipts.

## 📁 Step 1: Create Folder Structure in Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Create the following structure:

```
My Drive/
└── Comptabilité/
    ├── Templates/
    ├── Factures/
    │   ├── 2025/
    │   └── 2026/
    └── Reçus/
        ├── 2025/
        └── 2026/
```

3. **Get Folder IDs**:
   - Open each folder in your browser
   - URL looks like: `https://drive.google.com/drive/folders/XXXXX`
   - Copy the `XXXXX` part (the folder ID)
   - Note:
     - `Factures/` folder ID → For `VITE_DRIVE_FOLDER_FACTURES_ID`
     - `Reçus/` folder ID → For `VITE_DRIVE_FOLDER_RECUS_ID`

## 📄 Step 2: Create Invoice Template

1. Create a new **Google Docs** in the `Templates/` folder
2. Name it: `Template_Facture`
3. Copy-paste the following content:

```
===========================================
            INVOICE
===========================================

Reference: {{REFERENCE_PAIEMENT}}
Date: {{DATE_FACTURE}}

-------------------------------------------
CLIENT
-------------------------------------------

Name: {{NOM_CLIENT}}
Email: {{EMAIL_CLIENT}}
Phone: {{TELEPHONE_CLIENT}}
Address: {{ADRESSE_CLIENT}}
SIRET: {{SIRET_CLIENT}}

-------------------------------------------
SERVICE DETAILS
-------------------------------------------

{{LISTE_PRESTATIONS}}

-------------------------------------------
TOTAL: {{TOTAL}}
-------------------------------------------

Payment method: {{MODE_ENCAISSEMENT}}
Payment date: {{DATE_ENCAISSEMENT}}

Thank you for your business!
```

4. **Customize** the template according to your needs (logo, legal mentions, etc.)
5. **Important**: Keep all `{{PLACEHOLDERS}}` exactly as indicated
6. **Get template ID**:
   - URL: `https://docs.google.com/document/d/YYYYY/edit`
   - Copy the `YYYYY` part → For `VITE_TEMPLATE_FACTURE_ID`

## 📄 Step 3: Create Receipt Template

1. Create a new **Google Docs** in the `Templates/` folder
2. Name it: `Template_Recu`
3. Copy-paste the following content:

```
===========================================
            RECEIPT
===========================================

Reference: {{REFERENCE_PAIEMENT}}
Generation date: {{DATE_FACTURE}}
Payment date: {{DATE_ENCAISSEMENT}}

-------------------------------------------
CLIENT
-------------------------------------------

Name: {{NOM_CLIENT}}
Email: {{EMAIL_CLIENT}}
Phone: {{TELEPHONE_CLIENT}}
Address: {{ADRESSE_CLIENT}}
SIRET: {{SIRET_CLIENT}}

-------------------------------------------
SERVICE DETAILS
-------------------------------------------

{{LISTE_PRESTATIONS}}

-------------------------------------------
Payment method: {{MODE_ENCAISSEMENT}}
TOTAL RECEIVED: {{TOTAL}}
-------------------------------------------

Thank you for your payment!
```

4. **Customize** the template according to your needs
5. **Important**: Keep all `{{PLACEHOLDERS}}` exactly as indicated
6. **Get template ID**:
   - URL: `https://docs.google.com/document/d/ZZZZZ/edit`
   - Copy the `ZZZZZ` part → For `VITE_TEMPLATE_RECU_ID`

## ⚙️ Step 4: Configuration in .env

Add the retrieved IDs to your `.env` file:

```bash
# Google Docs Templates
VITE_TEMPLATE_FACTURE_ID=YYYYY_from_step_2
VITE_TEMPLATE_RECU_ID=ZZZZZ_from_step_3

# Google Drive Folders
VITE_DRIVE_FOLDER_FACTURES_ID=XXXXX_factures_folder
VITE_DRIVE_FOLDER_RECUS_ID=XXXXX_recus_folder
```

## 🔐 Step 5: Permissions (Important!)

Templates and folders must be **accessible** with your Google account:

1. **Check permissions**:
   - Open each template and folder
   - Click "Share"
   - Your Google account must have "Editor" or "Owner" access

2. **Note**: The application uses your OAuth token, so everything accessible from your Google account will be accessible to the application.

## 🎨 Advanced Customization

### Available variables for INVOICES and RECEIPTS (all available for both):

**Payment Information:**
- `{{REFERENCE_PAIEMENT}}` - Payment ID (ex: 2603150001)
- `{{DATE_FACTURE}}` - Document generation date (format: DD/MM/YYYY)
- `{{DATE_ENCAISSEMENT}}` - Payment date (or "Not cashed" if not yet paid)
- `{{MODE_ENCAISSEMENT}}` - Payment method (Transfer, Cash, Check, PayPal, Other or "Not specified")
- `{{TOTAL}}` - Total amount (format: 1 234,56 €)

**Client Information:**
- `{{NOM_CLIENT}}` - Client name
- `{{EMAIL_CLIENT}}` - Client email
- `{{TELEPHONE_CLIENT}}` - Client phone (or "Not provided")
- `{{ADRESSE_CLIENT}}` - Full address (or "Not provided")
- `{{SIRET_CLIENT}}` - SIRET number (or "Not provided")

**Details:**
- `{{LISTE_PRESTATIONS}}` - Services table (date, type, amount)

### Formatting tips:

- Use **Bold** for titles
- Use **tables** for `{{LISTE_PRESTATIONS}}` (optional)
- Add your **logo** at the top of the document
- Add your **legal mentions** at the bottom
- Use **colors** to make the document more professional

## ✅ Step 6: Test Generation

1. Restart your development server (to load new environment variables)
2. Create a payment in the application
3. Click "Generate invoice"
4. Verify that:
   - Document is created in the correct Drive folder
   - All variables are replaced
   - PDF is accessible via the link

## ❓ Troubleshooting

### Error: "Template ... ID not configured"
- Verify IDs are in the `.env` file
- Restart server after modifying `.env`

### Error: "Drive API error: 404"
- Template or folder IDs are incorrect
- Check permissions (your account must have access)

### Error: "Cannot generate receipt: payment not yet cashed"
- Receipt can only be generated for paid payments
- Add a payment date to the payment first

### Variables are not replaced
- Verify placeholders are **exactly** as indicated (uppercase, braces)
- Correct example: `{{TOTAL}}`
- Incorrect examples: `{{ TOTAL }}` or `{{total}}`

## 📚 Resources

- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
