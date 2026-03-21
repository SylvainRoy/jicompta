/**
 * Paiement Card Component - Mobile-friendly card view
 */

import type { Paiement } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

interface PaiementCardProps {
  paiement: Paiement;
  prestationsCount: number;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onGenerateFacture: () => void;
  onGenerateRecu: () => void;
  isGeneratingFacture?: boolean;
  isGeneratingRecu?: boolean;
}

export default function PaiementCard({
  paiement,
  prestationsCount,
  onViewDetails,
  onEdit,
  onDelete,
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
        <button onClick={onViewDetails} className="flex-1 text-left group">
          <h3 className="text-lg font-semibold text-blue-600 group-hover:text-blue-800 group-hover:underline">
            #{paiement.reference}
          </h3>
          <p className="text-sm text-gray-600">{paiement.client}</p>
        </button>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Details - Grid layout on mobile */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Top-left: Date encaissement */}
        <div className="min-w-0">
          <p className="text-xs text-gray-500 mb-1">Date d'encaissement</p>
          {paiement.date_encaissement ? (
            <p className="text-sm font-medium text-gray-900">
              {formatDateForDisplay(paiement.date_encaissement)}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">Non encaissé</p>
          )}
        </div>

        {/* Top-right: Montant */}
        <div className="min-w-0 text-right">
          <p className="text-xs text-gray-500 mb-1">Montant</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(paiement.total)}</p>
        </div>

        {/* Bottom-left: Prestations */}
        <div className="min-w-0">
          <p className="text-xs text-gray-500 mb-1">Prestations</p>
          <button
            onClick={onViewDetails}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {prestationsCount} prestation{prestationsCount > 1 ? 's' : ''}
          </button>
        </div>

        {/* Bottom-right: Mode */}
        <div className="min-w-0 text-right">
          <p className="text-xs text-gray-500 mb-1">Mode</p>
          {paiement.mode_encaissement ? (
            <p className="text-sm font-medium text-gray-900 capitalize truncate">
              {paiement.mode_encaissement}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">-</p>
          )}
        </div>
      </div>

      {/* Notes indicator */}
      {paiement.notes && (
        <div className="flex items-center gap-1 mb-3 text-gray-500">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-xs italic truncate">{paiement.notes}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Modifier
          </button>
          {!isEncaisse && onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Supprimer
            </button>
          )}
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
