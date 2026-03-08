/**
 * Prestations Page - Complete CRUD
 */

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import type { Prestation } from '@/types';
import Button from '@/components/common/Button';
import Modal, { ConfirmModal } from '@/components/common/Modal';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import PrestationForm from '@/components/forms/PrestationForm';
import PrestationCard from '@/components/common/PrestationCard';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Prestations() {
  const {
    prestations,
    paiements,
    clients,
    typesPrestations,
    isLoading,
    addPrestation,
    updatePrestation,
    deletePrestation,
  } = useData();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPrestation, setEditingPrestation] = useState<{
    prestation: Prestation;
    index: number;
  } | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Filtered prestations based on search and status filter
  const filteredPrestations = useMemo(() => {
    let filtered = prestations;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (prestation) =>
          prestation.nom_client.toLowerCase().includes(query) ||
          prestation.type_prestation.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatut) {
      if (filterStatut === 'non_facturee') {
        // No payment linked
        filtered = filtered.filter((prestation) => !prestation.paiement_id);
      } else if (filterStatut === 'facturee') {
        // Payment linked but not received
        filtered = filtered.filter((prestation) => {
          if (!prestation.paiement_id) return false;
          const linkedPaiement = paiements.find(p => p.reference === prestation.paiement_id);
          return linkedPaiement && !linkedPaiement.date_encaissement;
        });
      } else if (filterStatut === 'encaissee') {
        // Payment received
        filtered = filtered.filter((prestation) => {
          if (!prestation.paiement_id) return false;
          const linkedPaiement = paiements.find(p => p.reference === prestation.paiement_id);
          return linkedPaiement && !!linkedPaiement.date_encaissement;
        });
      }
    }

    return filtered;
  }, [prestations, paiements, searchQuery, filterStatut]);

  // Handlers
  const handleAdd = async (prestation: Prestation) => {
    await addPrestation(prestation);
    setIsAddModalOpen(false);
  };

  const handleEdit = async (prestation: Prestation) => {
    if (editingPrestation) {
      await updatePrestation(editingPrestation.index, prestation);
      setEditingPrestation(null);
    }
  };

  const handleDelete = async () => {
    if (deletingIndex !== null) {
      try {
        await deletePrestation(deletingIndex);
        setDeletingIndex(null);
      } catch (error) {
        // Error is handled in DataContext
        setDeletingIndex(null);
      }
    }
  };

  const getStatutDisplay = (prestation: Prestation) => {
    // No payment linked
    if (!prestation.paiement_id) {
      return {
        label: 'Non facturée',
        color: 'bg-yellow-100 text-yellow-800',
      };
    }

    // Find the linked payment
    const linkedPaiement = paiements.find(p => p.reference === prestation.paiement_id);

    // Payment received (encaissé)
    if (linkedPaiement && linkedPaiement.date_encaissement) {
      return {
        label: 'Encaissée',
        color: 'bg-green-100 text-green-800',
      };
    }

    // Payment created but not received yet
    return {
      label: 'Facturée',
      color: 'bg-blue-100 text-blue-800',
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" message="Chargement des prestations..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Prestations</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          className="w-full sm:w-auto"
          disabled={clients.length === 0 || typesPrestations.length === 0}
        >
          + Ajouter une prestation
        </Button>
      </div>

      {/* Warning if no clients or types */}
      {(clients.length === 0 || typesPrestations.length === 0) && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Configuration requise</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {clients.length === 0 && typesPrestations.length === 0
                  ? 'Vous devez d\'abord créer des clients et des types de prestations.'
                  : clients.length === 0
                  ? 'Vous devez d\'abord créer au moins un client.'
                  : 'Vous devez d\'abord créer au moins un type de prestation.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      {prestations.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher par client ou type..."
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="non_facturee">Non facturée</option>
              <option value="facturee">Facturée</option>
              <option value="encaissee">Encaissée</option>
            </select>
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {filteredPrestations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title={searchQuery || filterStatut ? 'Aucune prestation trouvée' : 'Aucune prestation'}
            description={
              searchQuery || filterStatut
                ? 'Aucune prestation ne correspond à vos critères.'
                : 'Commencez par ajouter votre première prestation.'
            }
            action={
              !searchQuery && !filterStatut && clients.length > 0 && typesPrestations.length > 0
                ? {
                    label: 'Ajouter une prestation',
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
            {filteredPrestations.map((prestation) => {
              const actualIndex = prestations.indexOf(prestation);
              const statut = getStatutDisplay(prestation);
              return (
                <PrestationCard
                  key={actualIndex}
                  prestation={prestation}
                  statusLabel={statut.label}
                  statusColor={statut.color}
                  onEdit={() => setEditingPrestation({ prestation, index: actualIndex })}
                  onDelete={() => setDeletingIndex(actualIndex)}
                />
              );
            })}

            {/* Results count - Mobile */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-700 text-center">
                {filteredPrestations.length} prestation{filteredPrestations.length > 1 ? 's' : ''}
                {(searchQuery || filterStatut) && ` (${prestations.length} au total)`}
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
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type de prestation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrestations.map((prestation) => {
                    const actualIndex = prestations.indexOf(prestation);
                    const statut = getStatutDisplay(prestation);

                    return (
                      <tr key={actualIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {prestation.nom_client}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{prestation.type_prestation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateForDisplay(prestation.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatCurrency(prestation.montant)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statut.color}`}
                          >
                            {statut.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                setEditingPrestation({ prestation, index: actualIndex })
                              }
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
                {filteredPrestations.length} prestation{filteredPrestations.length > 1 ? 's' : ''}
                {(searchQuery || filterStatut) && ` (${prestations.length} au total)`}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une prestation"
        size="md"
      >
        <PrestationForm
          clients={clients}
          typesPrestations={typesPrestations}
          onSubmit={handleAdd}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingPrestation && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPrestation(null)}
          title="Modifier la prestation"
          size="md"
        >
          <PrestationForm
            prestation={editingPrestation.prestation}
            clients={clients}
            typesPrestations={typesPrestations}
            onSubmit={handleEdit}
            onCancel={() => setEditingPrestation(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deletingIndex !== null}
        onClose={() => setDeletingIndex(null)}
        onConfirm={handleDelete}
        title="Supprimer la prestation"
        message={`Êtes-vous sûr de vouloir supprimer cette prestation ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
