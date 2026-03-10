/**
 * Dashboard Page - Main statistics and recent activity
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useNotification } from '@/contexts/NotificationContext';
import { generateTaxReport } from '@/services/googleDocs';
import Loading from '@/components/common/Loading';
import Button from '@/components/common/Button';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Dashboard() {
  const { prestations, paiements, clients, typesPrestations, isLoading } = useData();
  const navigate = useNavigate();
  const { info, success, error: notifyError } = useNotification();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    prestations.forEach((p) => {
      if (p.date) {
        const year = parseInt(p.date.split('-')[0], 10);
        years.add(year);
      }
    });
    paiements.forEach((p) => {
      if (p.date_encaissement) {
        const year = parseInt(p.date_encaissement.split('-')[0], 10);
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [prestations, paiements]);

  // Calculate statistics based on selected year
  const stats = useMemo(() => {
    // Filter prestations by year
    const filteredPrestations = selectedYear === 'all'
      ? prestations
      : prestations.filter((p) => {
          if (!p.date) return false;
          const year = parseInt(p.date.split('-')[0], 10);
          return year === selectedYear;
        });

    const nombrePrestations = filteredPrestations.length;
    const montantPrestations = filteredPrestations.reduce(
      (sum, p) => sum + (Number(p.montant) || 0),
      0
    );

    // Prestations without payment
    const prestationsSansPaiement = filteredPrestations.filter((p) => !p.paiement_id);
    const nombrePrestationsSansPaiement = prestationsSansPaiement.length;
    const montantPrestationsSansPaiement = prestationsSansPaiement.reduce(
      (sum, p) => sum + (Number(p.montant) || 0),
      0
    );

    // Filter paiements by year (based on date_encaissement or all paiements if not encaissé)
    const filteredPaiements = selectedYear === 'all'
      ? paiements
      : paiements.filter((p) => {
          // Include paiement if it's not encaissé yet, or if encaissé in selected year
          if (!p.date_encaissement) return true;
          const year = parseInt(p.date_encaissement.split('-')[0], 10);
          return year === selectedYear;
        });

    const nombrePaiements = filteredPaiements.length;
    const montantPaiements = filteredPaiements.reduce(
      (sum, p) => sum + (Number(p.total) || 0),
      0
    );

    // Paiements en attente (not encaissé)
    const paiementsEnAttente = filteredPaiements.filter((p) => !p.date_encaissement);
    const nombrePaiementsEnAttente = paiementsEnAttente.length;
    const montantPaiementsEnAttente = paiementsEnAttente.reduce(
      (sum, p) => sum + (Number(p.total) || 0),
      0
    );

    // Top 3 clients with most pending payments
    const clientPendingPayments: Record<string, { count: number; total: number }> = {};
    paiementsEnAttente.forEach((p) => {
      if (!clientPendingPayments[p.client]) {
        clientPendingPayments[p.client] = { count: 0, total: 0 };
      }
      clientPendingPayments[p.client].count++;
      clientPendingPayments[p.client].total += Number(p.total) || 0;
    });

    const topClientsWithPendingPayments = Object.entries(clientPendingPayments)
      .map(([client, data]) => ({ client, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    return {
      nombrePrestations,
      montantPrestations,
      nombrePrestationsSansPaiement,
      montantPrestationsSansPaiement,
      nombrePaiements,
      montantPaiements,
      nombrePaiementsEnAttente,
      montantPaiementsEnAttente,
      topClientsWithPendingPayments,
    };
  }, [prestations, paiements, selectedYear]);

  // Recent prestations (last 5)
  const recentPrestations = useMemo(() => {
    return prestations
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [prestations]);

  // Recent paiements (last 5)
  const recentPaiements = useMemo(() => {
    return paiements
      .slice()
      .sort((a, b) => {
        const dateA = a.date_encaissement || a.reference;
        const dateB = b.date_encaissement || b.reference;
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [paiements]);

  // Unpaid paiements
  const unpaidPaiements = useMemo(() => {
    return paiements.filter((p) => !p.date_encaissement);
  }, [paiements]);

  const handleGenerateTaxReport = async () => {
    if (selectedYear === 'all') {
      notifyError('Veuillez sélectionner une année spécifique pour le rapport fiscal');
      return;
    }

    setIsGeneratingReport(true);
    try {
      info('Génération du rapport fiscal en cours... Cela peut prendre jusqu\'à 30 secondes.');
      const filename = await generateTaxReport(selectedYear, prestations, paiements, clients, typesPrestations);
      success(`Rapport fiscal ${selectedYear} téléchargé: ${filename}`);
    } catch (error) {
      console.error('Failed to generate tax report:', error);
      notifyError('Échec de la génération du rapport fiscal');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" message="Chargement du tableau de bord..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
            Tableau de bord
          </h1>
          <p className="text-sm text-gray-600">Vue d'ensemble de votre activité</p>
        </div>

        {/* Year selector and tax report button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              Année:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="block rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm font-medium bg-gray-50"
            >
              <option value="all">Toutes</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleGenerateTaxReport}
            variant="primary"
            disabled={isGeneratingReport || selectedYear === 'all'}
            className="whitespace-nowrap"
          >
            {isGeneratingReport ? 'Téléchargement...' : '📥 Rapport fiscal'}
          </Button>
        </div>
      </div>

      {/* Prestations Section */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md p-4 sm:p-6 mb-4 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Prestations</h2>
        </div>
        <div className="space-y-3 text-sm sm:text-base">
          <p className="text-gray-700">
            <span className="font-semibold">{stats.nombrePrestations}</span> prestations (
            <span className="font-semibold text-blue-600">{formatCurrency(stats.montantPrestations)}</span>
            ) sur l'année <span className="font-semibold">{selectedYear === 'all' ? 'toutes' : selectedYear}</span>.
          </p>
          <button
            onClick={() => navigate('/prestations?filter=non_facturee')}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between bg-orange-50 hover:bg-orange-100 rounded-lg p-3 transition-all duration-200 border border-orange-200">
              <div className="flex-1">
                <p className="text-gray-700">
                  <span className="font-semibold">{stats.nombrePrestationsSansPaiement}</span> prestations (
                  <span className="font-semibold text-orange-600">{formatCurrency(stats.montantPrestationsSansPaiement)}</span>
                  ) n'ont pas de paiement
                </p>
              </div>
              <svg className="w-6 h-6 text-orange-600 ml-3 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Paiements Section */}
      <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-md p-4 sm:p-6 mb-4 border border-green-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Paiements</h2>
        </div>
        <div className="space-y-3 text-sm sm:text-base">
          <p className="text-gray-700">
            <span className="font-semibold">{stats.nombrePaiements}</span> paiements (
            <span className="font-semibold text-green-600">{formatCurrency(stats.montantPaiements)}</span>
            ) sur l'année <span className="font-semibold">{selectedYear === 'all' ? 'toutes' : selectedYear}</span>.
          </p>
          <button
            onClick={() => navigate('/paiements?filter=en_attente')}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between bg-red-50 hover:bg-red-100 rounded-lg p-3 transition-all duration-200 border border-red-200">
              <div className="flex-1">
                <p className="text-gray-700">
                  <span className="font-semibold">{stats.nombrePaiementsEnAttente}</span> paiements (
                  <span className="font-semibold text-red-600">{formatCurrency(stats.montantPaiementsEnAttente)}</span>
                  ) sont en attente de règlement
                </p>
              </div>
              <svg className="w-6 h-6 text-red-600 ml-3 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Clients Section */}
      <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-md p-4 sm:p-6 mb-4 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Clients</h2>
        </div>
        <div className="space-y-3 text-sm sm:text-base">
          <p className="text-gray-700">
            <span className="font-semibold">{clients.length}</span> clients enregistrés.
          </p>

          {stats.topClientsWithPendingPayments.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-gray-700 font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Clients avec les plus gros paiements en attente:
              </p>
              <ul className="space-y-2">
                {stats.topClientsWithPendingPayments.map(({ client, count, total }) => (
                  <li key={client}>
                    <button
                      onClick={() => navigate(`/paiements?filter=en_attente&client=${encodeURIComponent(client)}`)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-center justify-between bg-white hover:bg-purple-100 rounded-lg p-2 transition-all duration-200 border border-purple-200">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{client}</p>
                          <p className="text-xs text-gray-600">
                            {count} paiement{count > 1 ? 's' : ''} • {formatCurrency(total)}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recent Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Prestations */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-100">
          <div className="px-4 py-3 border-b border-blue-200 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-semibold text-white">5 dernières prestations</h3>
            </div>
          </div>
          {recentPrestations.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Aucune prestation</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPrestations.map((p, index) => (
                <div key={index} className="px-4 py-3 hover:bg-blue-50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.nom_client}</p>
                      <p className="text-xs text-gray-600 truncate">{p.type_prestation}</p>
                      <p className="text-xs text-gray-500">{formatDateForDisplay(p.date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                      {formatCurrency(p.montant)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Paiements */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-green-100">
          <div className="px-4 py-3 border-b border-green-200 bg-gradient-to-r from-green-500 to-green-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-white">5 derniers paiements</h3>
            </div>
          </div>
          {recentPaiements.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>Aucun paiement</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPaiements.map((p, index) => (
                <div key={index} className="px-4 py-3 hover:bg-green-50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">#{p.reference}</p>
                      <p className="text-xs text-gray-600 truncate">{p.client}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {p.date_encaissement ? (
                          <>
                            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-gray-500">{formatDateForDisplay(p.date_encaissement)}</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-orange-600 font-medium">Non encaissé</p>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-green-600 whitespace-nowrap">
                      {formatCurrency(p.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Paiements (Alert) */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-red-100">
          <div className="px-4 py-3 border-b border-red-200 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-sm font-semibold text-white">Paiements non encaissés</h3>
            </div>
          </div>
          {unpaidPaiements.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <svg className="w-12 h-12 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-600 font-medium">Tous les paiements sont encaissés</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {unpaidPaiements.map((p, index) => (
                <div key={index} className="px-4 py-3 hover:bg-red-50 transition-colors bg-red-50/30">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">#{p.reference}</p>
                      <p className="text-xs text-gray-600 truncate">{p.client}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-600 font-medium">En attente</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-red-600 whitespace-nowrap">
                      {formatCurrency(p.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
