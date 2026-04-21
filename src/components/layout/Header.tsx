/**
 * Header Component - With mobile menu toggle
 */

import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';

const isTestEnv = __APP_ENV__ === 'test';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className={`shadow-sm border-b z-30 flex-shrink-0 ${isTestEnv ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}>
      {isTestEnv && (
        <div className="bg-amber-400 text-amber-900 text-center text-xs font-bold py-1 tracking-wide">
          ENVIRONNEMENT DE TEST
        </div>
      )}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="xl:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <h1 className="text-lg sm:text-xl font-bold text-gray-900">JiCompta</h1>
          {isTestEnv && (
            <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded">TEST</span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <>
              <div className="flex items-center gap-2">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={logout} className="text-sm">
                <span className="hidden sm:inline">Déconnexion</span>
                <span className="sm:hidden">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
