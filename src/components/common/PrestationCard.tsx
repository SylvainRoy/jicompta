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

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Date */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDateForDisplay(prestation.date)}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500">Montant</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(prestation.montant)}
            </p>
          </div>
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
