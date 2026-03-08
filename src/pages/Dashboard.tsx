/**
 * Dashboard Page - Main statistics and recent activity
 */

import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import Loading from '@/components/common/Loading';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Dashboard() {
  const { prestations, paiements, clients, typesPrestations, isLoading } = useData();

  // Calculate statistics
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Total ALL prestations (regardless of year)
    const totalPrestations = prestations.reduce(
      (sum, p) => sum + (Number(p.montant) || 0),
      0
    );

    // Total prestations for current year
    const prestationsThisYear = prestations.filter((p) => {
      if (!p.date) return false;
      const year = parseInt(p.date.split('-')[0], 10);
      return year === currentYear;
    });
    const totalPrestationsAnnee = prestationsThisYear.reduce(
      (sum, p) => sum + (Number(p.montant) || 0),
      0
    );

    // Paid prestations (with paiement_id)
    const paidPrestations = prestations.filter((p) => !!p.paiement_id);
    const totalPaid = paidPrestations.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);

    // Unpaid prestations
    const unpaidPrestations = prestations.filter((p) => !p.paiement_id);
    const totalUnpaid = unpaidPrestations.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);

    // Paiements encaissés (with date_encaissement)
    const encaissedPaiements = paiements.filter((p) => !!p.date_encaissement);
    const totalPaiementsEncaisses = encaissedPaiements.reduce(
      (sum, p) => sum + (Number(p.total) || 0),
      0
    );

    // Paiements encaissés pour l'année courante
    const paiementsEncaissesThisYear = encaissedPaiements.filter((p) => {
      if (!p.date_encaissement) return false;
      const year = parseInt(p.date_encaissement.split('-')[0], 10);
      return year === currentYear;
    });
    const totalPaiementsEncaissesAnnee = paiementsEncaissesThisYear.reduce(
      (sum, p) => sum + (Number(p.total) || 0),
      0
    );

    // Paiements en attente (without date_encaissement)
    const pendingPaiements = paiements.filter((p) => !p.date_encaissement);
    const nombrePaiementsEnAttente = pendingPaiements.length;
    const montantPaiementsEnAttente = pendingPaiements.reduce(
      (sum, p) => sum + (Number(p.total) || 0),
      0
    );

    return {
      totalPrestations,
      totalPrestationsAnnee,
      totalPaiementsEncaisses,
      totalPaiementsEncaissesAnnee,
      nombrePaiementsEnAttente,
      montantPaiementsEnAttente,
      totalPaid,
      totalUnpaid,
      unpaidPrestationsCount: unpaidPrestations.length,
      currentYear,
    };
  }, [prestations, paiements]);

  // Recent activity (last 5 prestations and paiements)
  const recentActivity = useMemo(() => {
    const activities: Array<{
      type: 'prestation' | 'paiement';
      date: string;
      description: string;
      amount: number;
    }> = [];

    // Add recent prestations
    prestations
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .forEach((p) => {
        activities.push({
          type: 'prestation',
          date: p.date,
          description: `Prestation ${p.type_prestation} - ${p.nom_client}`,
          amount: p.montant,
        });
      });

    // Add recent paiements (use date_encaissement or creation date)
    paiements
      .slice()
      .sort((a, b) => {
        const dateA = a.date_encaissement || a.reference.substring(0, 6);
        const dateB = b.date_encaissement || b.reference.substring(0, 6);
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5)
      .forEach((p) => {
        activities.push({
          type: 'paiement',
          date: p.date_encaissement || '', // Use reference date if no encaissement
          description: `Paiement #${p.reference} - ${p.client}`,
          amount: p.total,
        });
      });

    // Sort all by date and take top 10
    return activities
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [prestations, paiements]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" message="Chargement du tableau de bord..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-6">
        Tableau de bord
      </h1>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-8">
        {/* Total Prestations */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                Total des prestations
              </h3>
            </div>
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 break-all">
            {formatCurrency(stats.totalPrestations)}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Depuis le début
            {stats.totalPrestationsAnnee > 0 && (
              <span className="ml-2 text-blue-600">
                ({formatCurrency(stats.totalPrestationsAnnee)} en {stats.currentYear})
              </span>
            )}
          </p>
        </div>

        {/* Received Payments */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                Paiements encaissés
              </h3>
            </div>
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 break-all">
            {formatCurrency(stats.totalPaiementsEncaisses)}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Depuis le début
            {stats.totalPaiementsEncaissesAnnee > 0 && (
              <span className="ml-2 text-green-600">
                ({formatCurrency(stats.totalPaiementsEncaissesAnnee)} en {stats.currentYear})
              </span>
            )}
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                Paiements en attente
              </h3>
            </div>
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-600">
            {stats.nombrePaiementsEnAttente}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Paiement{stats.nombrePaiementsEnAttente !== 1 ? 's' : ''} non encaissé{stats.nombrePaiementsEnAttente !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Pending Amount */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                Montant en attente
              </h3>
            </div>
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 break-all">
            {formatCurrency(stats.montantPaiementsEnAttente)}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">À encaisser</p>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-8">
        <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-blue-600 font-medium">Clients actifs</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">{clients.length}</p>
            </div>
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-purple-600 font-medium">Types de prestations</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-900 mt-1">{typesPrestations.length}</p>
            </div>
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-yellow-600 font-medium">Prestations non facturées</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-900 mt-1">{stats.unpaidPrestationsCount}</p>
            </div>
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Activité récente</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-3 sm:px-6 py-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">Aucune activité récente</p>
            <p className="text-sm text-gray-500 mt-1">Créez des prestations et paiements pour voir l'activité</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="px-3 sm:px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {activity.type === 'prestation' ? (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.date ? formatDateForDisplay(activity.date) : 'Date inconnue'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs sm:text-sm font-semibold text-blue-600">
                      {formatCurrency(activity.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
