/// <reference types="vite/client" />

declare const __BUILD_DATE__: string;
declare const __COMMIT_HASH__: string;

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_REDIRECT_URI: string
  readonly VITE_SPREADSHEET_ID: string
  readonly VITE_TEMPLATE_FACTURE_ID: string
  readonly VITE_TEMPLATE_RECU_ID: string
  readonly VITE_DRIVE_FOLDER_FACTURES_ID: string
  readonly VITE_DRIVE_FOLDER_RECUS_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
