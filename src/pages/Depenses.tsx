/**
 * Depenses Page - Complete CRUD
 */

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import type { Depense } from '@/types';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import DepenseForm from '@/components/forms/DepenseForm';
import DepenseCard from '@/components/common/DepenseCard';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Depenses() {
  const {
    depenses,
    isLoading,
    addDepense,
    updateDepense,
    deleteDepense,
  } = useData();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompte, setFilterCompte] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDepense, setEditingDepense] = useState<{
    depense: Depense;
    index: number;
  } | null>(null);
  const [deletingDepense, setDeletingDepense] = useState<{
    depense: Depense;
    index: number;
  } | null>(null);

  // Get unique compte names for filter
  const compteNames = useMemo(() => {
    const names = new Set(depenses.map((d) => d.compte));
    return Array.from(names).sort();
  }, [depenses]);

  // Filtered depenses based on search and compte filter
  const filteredDepenses = useMemo(() => {
    let filtered = depenses;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (depense) =>
          depense.compte.toLowerCase().includes(query) ||
          depense.description.toLowerCase().includes(query)
      );
    }

    // Filter by compte
    if (filterCompte) {
      filtered = filtered.filter((depense) => depense.compte === filterCompte);
    }

    // Sort by date descending (newest first)
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [depenses, searchQuery, filterCompte]);

  // Calculate total
  const totalDepenses = useMemo(() => {
    return filteredDepenses.reduce((sum, depense) => sum + depense.montant, 0);
  }, [filteredDepenses]);

  // Handlers
  const handleAdd = async (depense: Depense) => {
    await addDepense(depense);
    setIsAddModalOpen(false);
  };

  const handleEdit = async (depense: Depense) => {
    if (editingDepense) {
      await updateDepense(editingDepense.index, depense);
      setEditingDepense(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingDepense) return;

    try {
      await deleteDepense(deletingDepense.index);
      setDeletingDepense(null);
    } catch (error) {
      // Error is handled by DataContext
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dépenses</h1>
        <p className="text-gray-600">
          Gérez vos dépenses sur différents comptes
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Rechercher par compte ou description..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterCompte}
            onChange={(e) => setFilterCompte(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les comptes</option>
            {compteNames.map((compte) => (
              <option key={compte} value={compte}>
                {compte}
              </option>
            ))}
          </select>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Nouvelle dépense
          </Button>
        </div>
      </div>

      {/* Stats */}
      {filteredDepenses.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-900">
              {filteredDepenses.length} dépense{filteredDepenses.length > 1 ? 's' : ''}
              {filterCompte && ` pour ${filterCompte}`}
            </span>
            <span className="text-lg font-bold text-blue-900">
              Total: {formatCurrency(totalDepenses)}
            </span>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        {filteredDepenses.length === 0 ? (
          <EmptyState
            title="Aucune dépense"
            description="Commencez par créer votre première dépense"
            actionLabel="Nouvelle dépense"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepenses.map((depense, index) => {
                const originalIndex = depenses.indexOf(depense);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateForDisplay(depense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {depense.compte}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {depense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(depense.montant)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setEditingDepense({ depense, index: originalIndex })}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => setDeletingDepense({ depense, index: originalIndex })}
                        className="ml-2"
                      >
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredDepenses.length === 0 ? (
          <EmptyState
            title="Aucune dépense"
            description="Commencez par créer votre première dépense"
            actionLabel="Nouvelle dépense"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          filteredDepenses.map((depense, index) => {
            const originalIndex = depenses.indexOf(depense);
            return (
              <DepenseCard
                key={index}
                depense={depense}
                onEdit={() => setEditingDepense({ depense, index: originalIndex })}
                onDelete={() => setDeletingDepense({ depense, index: originalIndex })}
              />
            );
          })
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Nouvelle dépense"
      >
        <DepenseForm
          onSubmit={handleAdd}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingDepense}
        onClose={() => setEditingDepense(null)}
        title="Modifier la dépense"
      >
        {editingDepense && (
          <DepenseForm
            depense={editingDepense.depense}
            onSubmit={handleEdit}
            onCancel={() => setEditingDepense(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingDepense}
        onClose={() => setDeletingDepense(null)}
        title="Supprimer la dépense"
      >
        <div>
          <p className="text-gray-700 mb-6">
            Êtes-vous sûr de vouloir supprimer cette dépense ?
          </p>
          {deletingDepense && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span>{' '}
                {formatDateForDisplay(deletingDepense.depense.date)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Compte:</span>{' '}
                {deletingDepense.depense.compte}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Description:</span>{' '}
                {deletingDepense.depense.description}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Montant:</span>{' '}
                {formatCurrency(deletingDepense.depense.montant)}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeletingDepense(null)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex-1"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
