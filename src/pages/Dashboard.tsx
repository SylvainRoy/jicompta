/**
 * Dashboard Page - Main statistics and recent activity
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import Loading from '@/components/common/Loading';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Dashboard() {
  const { prestations, paiements, clients, isLoading } = useData();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" message="Chargement du tableau de bord..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          Tableau de bord
        </h1>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
            Année:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tout</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prestations Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Prestations</h2>
        <div className="space-y-2 text-sm sm:text-base">
          <p className="text-gray-700">
            <span className="font-semibold">{stats.nombrePrestations}</span> prestations (
            <span className="font-semibold text-blue-600">{formatCurrency(stats.montantPrestations)}</span>
            ) sur l'année <span className="font-semibold">{selectedYear === 'all' ? 'toutes' : selectedYear}</span>.
          </p>
          <p className="text-gray-700">
            <button
              onClick={() => navigate('/prestations?filter=non_facturee')}
              className="hover:underline focus:outline-none focus:underline"
            >
              <span className="font-semibold">{stats.nombrePrestationsSansPaiement}</span> prestations (
              <span className="font-semibold text-orange-600">{formatCurrency(stats.montantPrestationsSansPaiement)}</span>
              ) n'ont pas de paiement
            </button>.
          </p>
        </div>
      </div>

      {/* Paiements Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Paiements</h2>
        <div className="space-y-2 text-sm sm:text-base">
          <p className="text-gray-700">
            <span className="font-semibold">{stats.nombrePaiements}</span> paiements (
            <span className="font-semibold text-green-600">{formatCurrency(stats.montantPaiements)}</span>
            ) sur l'année <span className="font-semibold">{selectedYear === 'all' ? 'toutes' : selectedYear}</span>.
          </p>
          <p className="text-gray-700">
            <button
              onClick={() => navigate('/paiements?filter=en_attente')}
              className="hover:underline focus:outline-none focus:underline"
            >
              <span className="font-semibold">{stats.nombrePaiementsEnAttente}</span> paiements (
              <span className="font-semibold text-red-600">{formatCurrency(stats.montantPaiementsEnAttente)}</span>
              ) sont en attente de règlement
            </button>.
          </p>
        </div>
      </div>

      {/* Clients Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Clients</h2>
        <div className="space-y-3 text-sm sm:text-base">
          <p className="text-gray-700">
            <span className="font-semibold">{clients.length}</span> clients enregistrés.
          </p>

          {stats.topClientsWithPendingPayments.length > 0 && (
            <div>
              <p className="text-gray-700 font-medium mb-2">Clients avec les plus gros paiements en attente:</p>
              <ul className="ml-4 space-y-1">
                {stats.topClientsWithPendingPayments.map(({ client, count, total }) => (
                  <li key={client} className="text-gray-600">
                    -{' '}
                    <button
                      onClick={() => navigate(`/paiements?filter=en_attente&client=${encodeURIComponent(client)}`)}
                      className="hover:underline focus:outline-none focus:underline text-gray-900 font-medium"
                    >
                      {client}
                    </button>{' '}
                    a {count} paiement{count > 1 ? 's' : ''} (
                    <span className="font-semibold text-red-600">{formatCurrency(total)}</span>
                    )
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
            <h3 className="text-sm font-semibold text-blue-900">5 dernières prestations créées</h3>
          </div>
          {recentPrestations.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Aucune prestation
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentPrestations.map((p, index) => (
                <div key={index} className="px-4 py-3 hover:bg-gray-50">
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
            <h3 className="text-sm font-semibold text-green-900">5 derniers paiements</h3>
          </div>
          {recentPaiements.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Aucun paiement
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentPaiements.map((p, index) => (
                <div key={index} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">#{p.reference}</p>
                      <p className="text-xs text-gray-600 truncate">{p.client}</p>
                      <p className="text-xs text-gray-500">
                        {p.date_encaissement ? formatDateForDisplay(p.date_encaissement) : 'Non encaissé'}
                      </p>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
            <h3 className="text-sm font-semibold text-red-900">Paiements non encaissés</h3>
          </div>
          {unpaidPaiements.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-green-600">
              Tous les paiements sont encaissés
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {unpaidPaiements.map((p, index) => (
                <div key={index} className="px-4 py-3 hover:bg-gray-50 bg-red-50/30">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">#{p.reference}</p>
                      <p className="text-xs text-gray-600 truncate">{p.client}</p>
                      <p className="text-xs text-red-600 font-medium">⚠ En attente</p>
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
