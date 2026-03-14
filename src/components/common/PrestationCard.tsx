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
  onEdit: () => void;
  onDelete: () => void;
}

export default function PrestationCard({
  prestation,
  statusLabel,
  statusColor,
  canModify,
  onEdit,
  onDelete,
}: PrestationCardProps) {

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header with Client and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{prestation.nom_client}</h3>
          <p className="text-sm text-gray-600">{prestation.type_prestation}</p>
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
