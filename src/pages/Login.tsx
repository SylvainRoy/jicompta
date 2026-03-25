/**
 * Login Page - With Google OAuth
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { checkExistingSetup } from '@/services/googleSetup';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import SetupWizard from '@/components/SetupWizard';
import { ROUTES } from '@/constants';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, handleGoogleSuccess } = useAuth();
  const { isConfigured, saveConfig } = useConfig();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isSearchingConfig, setIsSearchingConfig] = useState(false);
  const [configFound, setConfigFound] = useState(false);
  const hasSearched = useRef(false);

  // Search for existing config in Drive
  const searchForConfig = useCallback(async () => {
    // Prevent multiple searches
    if (hasSearched.current || isSearchingConfig) {
      return;
    }

    hasSearched.current = true;
    setIsSearchingConfig(true);

    try {
      console.log('🔍 Recherche de configuration dans Google Drive...');
      const existingConfig = await checkExistingSetup();

      if (existingConfig) {
        console.log('✅ Configuration trouvée dans Drive!');
        saveConfig(existingConfig);
        setIsSearchingConfig(false);
        setConfigFound(true); // Signal that config was found
      } else {
        console.log('❌ Aucune configuration trouvée, affichage du wizard');
        setIsSearchingConfig(false);
        setShowSetupWizard(true);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche de configuration:', error);
      setIsSearchingConfig(false);
      setShowSetupWizard(true);
    }
  }, [isSearchingConfig, saveConfig]);

  // Google Login Hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('✅ Google login success:', tokenResponse);
      const success = await handleGoogleSuccess(tokenResponse.access_token);
      if (success) {
        // Check if config exists locally
        if (!isConfigured) {
          // Search in Drive before showing wizard
          await searchForConfig();
        } else {
          navigate(ROUTES.DASHBOARD);
        }
      }
    },
    onError: (error) => {
      console.error('❌ Google login error:', error);
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive',
  });

  // Navigate to dashboard when config is found and fully loaded
  useEffect(() => {
    if (configFound && isConfigured) {
      console.log('🎯 Navigation vers le dashboard avec la config chargée');
      navigate(ROUTES.DASHBOARD);
    }
  }, [configFound, isConfigured, navigate]);

  // Trigger search when authenticated but not configured
  useEffect(() => {
    if (isAuthenticated && !isConfigured && !hasSearched.current && !isSearchingConfig && !configFound) {
      searchForConfig();
    }
  }, [isAuthenticated, isConfigured, isSearchingConfig, configFound]);

  // Navigate immediately if already configured from localStorage
  useEffect(() => {
    if (isAuthenticated && isConfigured && !configFound) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, isConfigured, configFound, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" message="Chargement..." />
      </div>
    );
  }

  // Show loading while searching for config in Drive
  if (isSearchingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading size="lg" message="Recherche de votre configuration..." />
          <p className="text-sm text-gray-500 mt-4">
            Vérification dans Google Drive...
          </p>
        </div>
      </div>
    );
  }

  // Show setup wizard if authenticated but not configured
  if (showSetupWizard) {
    return <SetupWizard onComplete={() => navigate(ROUTES.DASHBOARD)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">JiCompta</h1>
            <p className="text-gray-600">Application de gestion comptable</p>
          </div>

          {/* Login Info */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Bienvenue
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Connectez-vous avec votre compte Google pour accéder à votre espace comptable.
            </p>

            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Gestion complète des prestations et paiements</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Génération automatique de factures et reçus</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Données synchronisées avec Google Sheets</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => googleLogin()}
            className="flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Se connecter avec Google
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            En vous connectant, vous acceptez l'utilisation de vos données Google Sheets et Drive
          </p>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Build {__BUILD_DATE__} &middot; {__COMMIT_HASH__}
          </p>
        </div>
      </div>
    </div>
  );
}
