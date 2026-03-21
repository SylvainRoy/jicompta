/**
 * Prestation Card Component - Mobile-friendly card view
 */

import type { Prestation } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

interface PrestationCardProps {
  prestation: Prestation;
  statusLabel: string;
  statusColor: string;
  canModify: boolean;
  isHighlighted?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewPayment?: (paymentReference: string) => void;
}

export default function PrestationCard({
  prestation,
  statusLabel,
  statusColor,
  canModify,
  isHighlighted = false,
  onEdit,
  onDelete,
  onViewPayment,
}: PrestationCardProps) {

  return (
    <div
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${
        isHighlighted
          ? 'border-blue-400 ring-2 ring-blue-400 bg-blue-50'
          : 'border-gray-200'
      }`}
    >
      {/* Header with Client and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{prestation.nom_client}</h3>
          <p className="text-sm text-gray-600">{prestation.type_prestation}</p>
          {prestation.paiement_id && onViewPayment && (
            <button
              onClick={() => onViewPayment(prestation.paiement_id!)}
              className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block"
            >
              Paiement #{prestation.paiement_id}
            </button>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Details - Grid layout on mobile */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Left: Date */}
        <div className="min-w-0">
          <p className="text-xs text-gray-500 mb-1">Date</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDateForDisplay(prestation.date)}
          </p>
        </div>

        {/* Right: Amount */}
        <div className="min-w-0 text-right">
          <p className="text-xs text-gray-500 mb-1">Montant</p>
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(prestation.montant)}
          </p>
        </div>
      </div>

      {/* Notes indicator */}
      {prestation.notes && (
        <div className="flex items-center gap-1 mb-3 text-gray-500">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-xs italic truncate">{prestation.notes}</span>
        </div>
      )}

      {/* Actions */}
      {canModify ? (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Supprimer
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400 italic">Liée à un paiement</p>
        </div>
      )}
    </div>
  );
}
