/**
 * Type Prestation Card Component - Mobile-friendly card view
 */

import type { TypePrestation } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';

interface TypePrestationCardProps {
  typePrestation: TypePrestation;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TypePrestationCard({
  typePrestation,
  onEdit,
  onDelete,
}: TypePrestationCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Type Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{typePrestation.nom}</h3>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500">Montant suggéré</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(typePrestation.montant_suggere)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
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
    </div>
  );
}
