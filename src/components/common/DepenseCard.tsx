/**
 * Depense Card Component - Mobile-friendly card view
 */

import type { Depense } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

interface DepenseCardProps {
  depense: Depense;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DepenseCard({ depense, onEdit, onDelete }: DepenseCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{depense.compte}</h3>
          <p className="text-sm text-gray-500">{formatDateForDisplay(depense.date)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-red-600">{formatCurrency(depense.montant)}</p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">{depense.description}</p>
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
