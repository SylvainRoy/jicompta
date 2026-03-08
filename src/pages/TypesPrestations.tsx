/**
 * Types de Prestations Page - Complete CRUD
 */

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import type { TypePrestation } from '@/types';
import Button from '@/components/common/Button';
import Modal, { ConfirmModal } from '@/components/common/Modal';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import TypePrestationForm from '@/components/forms/TypePrestationForm';
import TypePrestationCard from '@/components/common/TypePrestationCard';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function TypesPrestations() {
  const { typesPrestations, isLoading, addTypePrestation, updateTypePrestation, deleteTypePrestation } = useData();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<{ type: TypePrestation; index: number } | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Filtered types based on search
  const filteredTypes = useMemo(() => {
    let filtered = searchQuery.trim()
      ? typesPrestations.filter((type) => {
          const query = searchQuery.toLowerCase();
          return type.nom.toLowerCase().includes(query);
        })
      : typesPrestations;

    // Reverse order to show newest first (last added = most recent)
    return [...filtered].reverse();
  }, [typesPrestations, searchQuery]);

  // Handlers
  const handleAdd = async (type: TypePrestation) => {
    await addTypePrestation(type);
    setIsAddModalOpen(false);
  };

  const handleEdit = async (type: TypePrestation) => {
    if (editingType) {
      await updateTypePrestation(editingType.index, type);
      setEditingType(null);
    }
  };

  const handleDelete = async () => {
    if (deletingIndex !== null) {
      try {
        await deleteTypePrestation(deletingIndex);
        setDeletingIndex(null);
      } catch (error) {
        // Error is handled in DataContext
        setDeletingIndex(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" message="Chargement des types de prestations..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Types de Prestations</h1>
        <Button onClick={() => setIsAddModalOpen(true)} variant="primary" className="w-full sm:w-auto">
          + Ajouter un type
        </Button>
      </div>

      {/* Search Bar */}
      {typesPrestations.length > 0 && (
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un type de prestation..."
          />
        </div>
      )}

      {/* Table or Empty State */}
      {filteredTypes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            title={searchQuery ? 'Aucun type trouvé' : 'Aucun type de prestation'}
            description={
              searchQuery
                ? 'Aucun type ne correspond à votre recherche.'
                : 'Commencez par ajouter votre premier type de prestation.'
            }
            action={
              !searchQuery
                ? {
                    label: 'Ajouter un type',
                    onClick: () => setIsAddModalOpen(true),
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile View - Cards (< md breakpoint) */}
          <div className="md:hidden space-y-4">
            {filteredTypes.map((type) => {
              const actualIndex = typesPrestations.indexOf(type);
              return (
                <TypePrestationCard
                  key={actualIndex}
                  typePrestation={type}
                  onEdit={() => setEditingType({ type, index: actualIndex })}
                  onDelete={() => setDeletingIndex(actualIndex)}
                />
              );
            })}

            {/* Results count - Mobile */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-700 text-center">
                {filteredTypes.length} type{filteredTypes.length > 1 ? 's' : ''}
                {searchQuery && ` (${typesPrestations.length} au total)`}
              </p>
            </div>
          </div>

          {/* Desktop View - Table (≥ md breakpoint) */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant suggéré
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTypes.map((type) => {
                    const actualIndex = typesPrestations.indexOf(type);

                    return (
                      <tr key={actualIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{type.nom}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatCurrency(type.montant_suggere)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingType({ type, index: actualIndex })}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => setDeletingIndex(actualIndex)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Results count - Desktop */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                {filteredTypes.length} type{filteredTypes.length > 1 ? 's' : ''}
                {searchQuery && ` (${typesPrestations.length} au total)`}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un type de prestation"
        size="md"
      >
        <TypePrestationForm onSubmit={handleAdd} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      {editingType && (
        <Modal
          isOpen={true}
          onClose={() => setEditingType(null)}
          title="Modifier le type de prestation"
          size="md"
        >
          <TypePrestationForm
            typePrestation={editingType.type}
            onSubmit={handleEdit}
            onCancel={() => setEditingType(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deletingIndex !== null}
        onClose={() => setDeletingIndex(null)}
        onConfirm={handleDelete}
        title="Supprimer le type de prestation"
        message={`Êtes-vous sûr de vouloir supprimer le type "${
          deletingIndex !== null ? typesPrestations[deletingIndex]?.nom : ''
        }" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
