/**
 * Setup Wizard Component
 * Guides users through automatic Google Drive setup
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { autoSetup, checkExistingSetup } from '@/services/googleSetup';
import { useConfig } from '@/contexts/ConfigContext';
import { useNotification } from '@/contexts/NotificationContext';
import Button from './common/Button';

interface SetupWizardProps {
  onComplete?: () => void;
}

type SetupStep = 'welcome' | 'checking' | 'found' | 'creating' | 'complete' | 'error';

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<SetupStep>('welcome');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { saveConfig } = useConfig();
  const { success, error: notifyError } = useNotification();
  const navigate = useNavigate();

  const handleAutoSetup = async () => {
    try {
      setError(null);
      setStep('checking');
      setProgressMessage('Vérification de la configuration existante...');
      setProgress(10);

      // Check if setup already exists
      const existing = await checkExistingSetup();

      if (existing) {
        setStep('found');
        saveConfig(existing);
        success('Configuration existante détectée et chargée!');
        setTimeout(() => {
          setStep('complete');
          if (onComplete) {
            onComplete();
          } else {
            navigate('/dashboard');
          }
        }, 2000);
        return;
      }

      // Create new setup
      setStep('creating');
      const config = await autoSetup((message, progressValue) => {
        setProgressMessage(message);
        setProgress(progressValue);
      });

      saveConfig(config);
      setStep('complete');
      success('Configuration terminée avec succès!');

      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Setup failed:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStep('error');
      notifyError('Échec de la configuration automatique');
    }
  };

  const handleManualSetup = () => {
    navigate('/settings');
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 sm:p-8">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 text-blue-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Bienvenue sur ComptaClaude!
            </h2>
            <p className="text-gray-600 mb-6">
              Pour commencer, nous devons configurer votre espace de travail dans Google Drive.
              Cette opération va créer automatiquement:
            </p>
            <ul className="text-left text-gray-700 space-y-2 mb-8 max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Un dossier <strong>Comptabilite/</strong> dans votre Drive</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Un tableur <strong>Compta</strong> avec vos données (Clients, Prestations, Paiements)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Des modèles personnalisables dans <strong>Modeles/</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Des sous-dossiers <strong>Factures/</strong> et <strong>Recus/</strong></span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleAutoSetup} variant="primary" fullWidth>
                Configurer automatiquement
              </Button>
              <Button onClick={handleManualSetup} variant="secondary" fullWidth>
                Configuration manuelle
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              La configuration prend environ 10-15 secondes
            </p>
          </div>
        )}

        {/* Checking Step */}
        {step === 'checking' && (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-blue-600 mx-auto animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recherche en cours...</h2>
            <p className="text-gray-600">{progressMessage}</p>
          </div>
        )}

        {/* Found Existing Step */}
        {step === 'found' && (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-green-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration trouvée!</h2>
            <p className="text-gray-600">
              Une configuration ComptaClaude existe déjà dans votre Drive. Chargement...
            </p>
          </div>
        )}

        {/* Creating Step */}
        {step === 'creating' && (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-blue-600 mx-auto animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration en cours...</h2>
            <p className="text-gray-600 mb-6">{progressMessage}</p>
            <div className="max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 text-green-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Configuration terminée!
            </h2>
            <p className="text-gray-600 mb-6">
              Votre espace ComptaClaude est prêt. Redirection vers le tableau de bord...
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Chargement...</span>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-red-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur de configuration</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setStep('welcome')} variant="primary" fullWidth>
                Réessayer
              </Button>
              <Button onClick={handleManualSetup} variant="secondary" fullWidth>
                Configuration manuelle
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
