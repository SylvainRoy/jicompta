/**
 * Main Layout Component - Responsive with mobile sidebar
 */

import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ToastContainer } from '@/components/common/Toast';
import { useNotification } from '@/contexts/NotificationContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { notifications, removeNotification } = useNotification();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar - Always visible on large screens */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar - Slide-in overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </>
        )}

        {/* Main Content - Only this panel scrolls */}
        <main className="flex-1 px-3 py-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      <ToastContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
}
