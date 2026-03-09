/**
 * Settings Page
 * Allows users to view and manage their JiCompta configuration
 */

import { useState, useEffect } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useData } from '@/contexts/DataContext';
import { autoSetup, createBackup, listBackups, restoreFromBackup, type Backup } from '@/services/googleSetup';
import Button from '@/components/common/Button';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Settings() {
  const { config, isConfigured, saveConfig, clearConfig } = useConfig();
  const { success, error: notifyError, warning, info } = useNotification();
  const { refreshAll } = useData();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<Backup | null>(null);

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

  // Load backups on mount
  useEffect(() => {
    if (isConfigured && config) {
      loadBackupsList();
    }
  }, [isConfigured, config]);

  const loadBackupsList = async () => {
    if (!config) return;

    setIsLoadingBackups(true);
    try {
      const backupsList = await listBackups(config.folderComptabiliteId);
      setBackups(backupsList);
    } catch (error) {
      console.error('Failed to load backups:', error);
      notifyError('Échec du chargement des sauvegardes');
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!config) return;

    setIsCreatingBackup(true);
    try {
      info('Création de la sauvegarde en cours...');
      const backup = await createBackup(config.spreadsheetId, config.folderComptabiliteId);
      success(`Sauvegarde créée: ${backup.name}`);
      // Reload backups list
      await loadBackupsList();
    } catch (error) {
      console.error('Failed to create backup:', error);
      notifyError('Échec de la création de la sauvegarde');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backup: Backup) => {
    if (!config) return;

    setIsRestoring(true);
    try {
      warning('Restauration en cours... Cela peut prendre quelques instants.');
      await restoreFromBackup(backup.id, config.spreadsheetId);
      success('Sauvegarde restaurée avec succès!');
      setShowRestoreConfirm(null);
      // Refresh data
      await refreshAll();
    } catch (error) {
      console.error('Failed to restore backup:', error);
      notifyError('Échec de la restauration');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatBackupDate = (dateStr: string) => {
    // dateStr format: YYMMDD
    if (dateStr.length !== 6) return dateStr;
    const year = `20${dateStr.slice(0, 2)}`;
    const month = dateStr.slice(2, 4);
    const day = dateStr.slice(4, 6);
    return formatDateForDisplay(`${year}-${month}-${day}`);
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

            {/* Backup & Restore Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Sauvegarde & Restauration</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Créez des sauvegardes de vos données et restaurez-les si nécessaire
                  </p>
                </div>
                <Button
                  onClick={handleCreateBackup}
                  variant="primary"
                  disabled={isCreatingBackup}
                >
                  {isCreatingBackup ? 'Création...' : '+ Créer une sauvegarde'}
                </Button>
              </div>

              {/* Backups List */}
              {isLoadingBackups ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 mt-2">Chargement des sauvegardes...</p>
                </div>
              ) : backups.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <p className="text-gray-600 text-sm">Aucune sauvegarde disponible</p>
                  <p className="text-gray-500 text-xs mt-1">Créez votre première sauvegarde pour sécuriser vos données</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{backup.name}</p>
                          <p className="text-xs text-gray-500">
                            Créé le {formatBackupDate(backup.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openInDrive(backup.id, 'spreadsheet')}
                          className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          title="Ouvrir dans Drive"
                        >
                          Voir
                        </button>
                        <Button
                          onClick={() => setShowRestoreConfirm(backup)}
                          variant="secondary"
                          disabled={isRestoring}
                        >
                          Restaurer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer la restauration
              </h3>
            </div>
            <p className="text-gray-600 mb-2">
              Êtes-vous sûr de vouloir restaurer depuis la sauvegarde:
            </p>
            <p className="text-sm font-medium text-gray-900 bg-gray-100 rounded px-3 py-2 mb-4">
              {showRestoreConfirm.name}
            </p>
            <p className="text-sm text-orange-600 mb-6">
              ⚠️ Attention: Toutes les données actuelles seront remplacées par celles de la sauvegarde. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleRestoreBackup(showRestoreConfirm)}
                variant="primary"
                disabled={isRestoring}
                fullWidth
              >
                {isRestoring ? 'Restauration...' : 'Restaurer'}
              </Button>
              <Button
                onClick={() => setShowRestoreConfirm(null)}
                variant="secondary"
                disabled={isRestoring}
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
