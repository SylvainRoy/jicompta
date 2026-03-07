/**
 * Paiement Card Component - Mobile-friendly card view
 */

import type { Paiement } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

interface PaiementCardProps {
  paiement: Paiement;
  prestationsCount: number;
  onEdit: () => void;
  onGenerateFacture: () => void;
  onGenerateRecu: () => void;
  isGeneratingFacture?: boolean;
  isGeneratingRecu?: boolean;
}

export default function PaiementCard({
  paiement,
  prestationsCount,
  onEdit,
  onGenerateFacture,
  onGenerateRecu,
  isGeneratingFacture = false,
  isGeneratingRecu = false,
}: PaiementCardProps) {
  const isEncaisse = !!paiement.date_encaissement;
  const statusLabel = isEncaisse ? 'Encaissé' : 'En attente';
  const statusColor = isEncaisse
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header with Reference and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">#{paiement.reference}</h3>
          <p className="text-sm text-gray-600">{paiement.client}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Total */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500">Montant</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(paiement.total)}</p>
          </div>
        </div>

        {/* Prestations count */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500">Prestations</p>
            <p className="text-sm font-medium text-gray-900">
              {prestationsCount} prestation{prestationsCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Date encaissement */}
        {paiement.date_encaissement && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Date d'encaissement</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateForDisplay(paiement.date_encaissement)}
              </p>
            </div>
          </div>
        )}

        {/* Mode encaissement */}
        {paiement.mode_encaissement && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">Mode</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {paiement.mode_encaissement}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Actions */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Modifier
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGenerateFacture}
            disabled={isGeneratingFacture}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {isGeneratingFacture && (
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isGeneratingFacture ? 'Génération...' : (paiement.facture ? 'Voir facture' : 'Générer facture')}
          </button>
          {isEncaisse && (
            <button
              onClick={onGenerateRecu}
              disabled={isGeneratingRecu}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {isGeneratingRecu && (
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isGeneratingRecu ? 'Génération...' : (paiement.recu ? 'Voir reçu' : 'Générer reçu')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
