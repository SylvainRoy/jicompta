/**
 * Settings Page
 * Allows users to view and manage their JiCompta configuration
 */

import { useState } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { useNotification } from '@/contexts/NotificationContext';
import { autoSetup } from '@/services/googleSetup';
import Button from '@/components/common/Button';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Settings() {
  const { config, isConfigured, saveConfig, clearConfig } = useConfig();
  const { success, error: notifyError, warning } = useNotification();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      warning('Création d\'une nouvelle configuration...');
      const newConfig = await autoSetup();
      saveConfig(newConfig);
      success('Configuration réinitialisée avec succès!');
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Reset failed:', error);
      notifyError('Échec de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearConfig = () => {
    clearConfig();
    success('Configuration effacée');
    setShowResetConfirm(false);
  };

  const openInDrive = (id: string, type: 'spreadsheet' | 'document' | 'folder') => {
    let url = '';
    if (type === 'spreadsheet') {
      url = `https://docs.google.com/spreadsheets/d/${id}`;
    } else if (type === 'document') {
      url = `https://docs.google.com/document/d/${id}`;
    } else {
      url = `https://drive.google.com/drive/folders/${id}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Paramètres</h1>

      {/* Configuration Status */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
          {isConfigured && (
            <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
              Configuré
            </span>
          )}
          {!isConfigured && (
            <span className="px-3 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded-full">
              Non configuré
            </span>
          )}
        </div>

        {isConfigured && config && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Configuration créée le {formatDateForDisplay(config.setupDate.split('T')[0])}
            </p>

            <div className="space-y-4">
              {/* Spreadsheet */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Tableur JiCompta</h3>
                    <p className="text-xs text-gray-500 font-mono break-all">{config.spreadsheetId}</p>
                  </div>
                  <button
                    onClick={() => openInDrive(config.spreadsheetId, 'spreadsheet')}
                    className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Ouvrir
                  </button>
                </div>
              </div>

              {/* Modèle de Facture */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Modèle de Facture</h3>
                    <p className="text-xs text-gray-500 font-mono break-all">{config.templateFactureId}</p>
                  </div>
                  <button
                    onClick={() => openInDrive(config.templateFactureId, 'document')}
                    className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Ouvrir
                  </button>
                </div>
              </div>

              {/* Modèle de Reçu */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Modèle de Reçu</h3>
                    <p className="text-xs text-gray-500 font-mono break-all">{config.templateRecuId}</p>
                  </div>
                  <button
                    onClick={() => openInDrive(config.templateRecuId, 'document')}
                    className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Ouvrir
                  </button>
                </div>
              </div>

              {/* Dossier Factures */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Dossier Factures</h3>
                    <p className="text-xs text-gray-500 font-mono break-all">{config.folderFacturesId}</p>
                  </div>
                  <button
                    onClick={() => openInDrive(config.folderFacturesId, 'folder')}
                    className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Ouvrir
                  </button>
                </div>
              </div>

              {/* Dossier Reçus */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Dossier Reçus</h3>
                    <p className="text-xs text-gray-500 font-mono break-all">{config.folderRecusId}</p>
                  </div>
                  <button
                    onClick={() => openInDrive(config.folderRecusId, 'folder')}
                    className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Zone dangereuse</h3>
              <p className="text-sm text-gray-600 mb-4">
                Réinitialiser la configuration créera de nouvelles ressources dans votre Drive.
                Les anciennes ressources ne seront pas supprimées.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  variant="secondary"
                  disabled={isResetting}
                >
                  Réinitialiser la configuration
                </Button>
                <Button
                  onClick={handleClearConfig}
                  variant="secondary"
                  disabled={isResetting}
                >
                  Effacer la configuration locale
                </Button>
              </div>
            </div>
          </>
        )}

        {!isConfigured && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Aucune configuration trouvée. Veuillez lancer le setup automatique depuis la page de connexion.
            </p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">À propos de la configuration</h2>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>La configuration est stockée localement dans votre navigateur</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>Toutes vos données restent dans votre Google Drive personnel</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>Vous pouvez personnaliser les templates directement dans Google Docs</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>En cas de problème, réinitialisez la configuration pour repartir de zéro</span>
          </li>
        </ul>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirmer la réinitialisation
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir créer une nouvelle configuration?
              Cela créera de nouvelles ressources dans votre Drive (les anciennes ne seront pas supprimées).
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleReset}
                variant="primary"
                disabled={isResetting}
                fullWidth
              >
                {isResetting ? 'Création...' : 'Confirmer'}
              </Button>
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="secondary"
                disabled={isResetting}
                fullWidth
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
