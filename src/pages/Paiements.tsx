/**
 * Paiements Page - Complete CRUD
 */

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useNotification } from '@/contexts/NotificationContext';
import type { Paiement } from '@/types';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import PaiementForm from '@/components/forms/PaiementForm';
import PaiementCard from '@/components/common/PaiementCard';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';

export default function Paiements() {
  const {
    paiements,
    prestations,
    isLoading,
    addPaiement,
    updatePaiement,
    deletePaiement,
    updatePrestation,
    generateFactureForPaiement,
    generateRecuForPaiement,
  } = useData();

  const { info: notifyInfo, removeNotification } = useNotification();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPaiement, setEditingPaiement] = useState<{
    paiement: Paiement;
    index: number;
  } | null>(null);
  const [generatingFacture, setGeneratingFacture] = useState<number | null>(null);
  const [generatingRecu, setGeneratingRecu] = useState<number | null>(null);
  const [deletingPaiement, setDeletingPaiement] = useState<{
    paiement: Paiement;
    index: number;
  } | null>(null);

  // Filtered paiements based on search and status filter
  const filteredPaiements = useMemo(() => {
    let filtered = paiements;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (paiement) =>
          paiement.client.toLowerCase().includes(query) ||
          paiement.reference.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatut) {
      if (filterStatut === 'encaisse') {
        filtered = filtered.filter((paiement) => !!paiement.date_encaissement);
      } else if (filterStatut === 'en_attente') {
        filtered = filtered.filter((paiement) => !paiement.date_encaissement);
      }
    }

    // Sort by reference descending (newest first - reference format: yymmddnnnn)
    return filtered.sort((a, b) => b.reference.localeCompare(a.reference));
  }, [paiements, searchQuery, filterStatut]);

  // Get prestations count for each paiement
  const getPrestationsCount = (reference: string): number => {
    return prestations.filter((p) => p.paiement_id === reference).length;
  };

  // Check if there are unpaid prestations
  // A prestation is unpaid if it has no paiement_id OR if its payment is not yet encaissé
  const hasUnpaidPrestations = prestations.some((p) => {
    if (!p.paiement_id) {
      return true; // No payment linked
    }
    // Check if the linked payment is encaissé
    const payment = paiements.find(pmt => pmt.reference === p.paiement_id);
    return payment && !payment.date_encaissement; // Payment exists but not yet encaissé
  });

  // Handlers
  const handleAdd = async (paiement: Paiement, prestationIndices: number[]) => {
    await addPaiement(paiement, prestationIndices);
    setIsAddModalOpen(false);
  };

  const handleEdit = async (paiement: Paiement, prestationIndices: number[]) => {
    if (editingPaiement) {
      await updatePaiement(editingPaiement.index, paiement);
      setEditingPaiement(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingPaiement) return;

    const { paiement, index } = deletingPaiement;

    // Cannot delete if payment has been received
    if (paiement.date_encaissement) {
      return;
    }

    try {
      // Find all prestations linked to this payment
      const linkedPrestations = prestations
        .map((p, idx) => ({ prestation: p, index: idx }))
        .filter(({ prestation }) => prestation.paiement_id === paiement.reference);

      // Unlink prestations first
      for (const { prestation, index: prestationIndex } of linkedPrestations) {
        const updatedPrestation = { ...prestation, paiement_id: '' };
        await updatePrestation(prestationIndex, updatedPrestation);
      }

      // Delete the payment
      await deletePaiement(index);

      // Close modal
      setDeletingPaiement(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
      // Modal will stay open so user can retry or cancel
    }
  };

  const handleGenerateFacture = async (paiement: Paiement, index: number) => {
    try {
      // If facture already exists, just open it
      if (paiement.facture) {
        window.open(paiement.facture, '_blank');
        return;
      }

      // Set loading state
      setGeneratingFacture(index);

      // Show persistent notification
      const notificationId = notifyInfo('🔄 Génération de la facture en cours...', true);

      // Generate facture
      const factureUrl = await generateFactureForPaiement(index);

      // Remove persistent notification
      removeNotification(notificationId);

      // Clear loading state
      setGeneratingFacture(null);

      // Open PDF in new tab
      window.open(factureUrl, '_blank');
    } catch (error) {
      console.error('Error with facture:', error);
      setGeneratingFacture(null);
    }
  };

  const handleGenerateRecu = async (paiement: Paiement, index: number) => {
    try {
      // If reçu already exists, just open it
      if (paiement.recu) {
        window.open(paiement.recu, '_blank');
        return;
      }

      // Set loading state
      setGeneratingRecu(index);

      // Show persistent notification
      const notificationId = notifyInfo('🔄 Génération du reçu en cours...', true);

      // Generate reçu
      const recuUrl = await generateRecuForPaiement(index);

      // Remove persistent notification
      removeNotification(notificationId);

      // Clear loading state
      setGeneratingRecu(null);

      // Open PDF in new tab
      window.open(recuUrl, '_blank');
    } catch (error) {
      console.error('Error with reçu:', error);
      setGeneratingRecu(null);
    }
  };

  const getStatutDisplay = (paiement: Paiement) => {
    const isEncaisse = !!paiement.date_encaissement;
    return {
      label: isEncaisse ? 'Encaissé' : 'En attente',
      color: isEncaisse ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" message="Chargement des paiements..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paiements</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          className="w-full sm:w-auto"
          disabled={!hasUnpaidPrestations}
        >
          + Créer un paiement
        </Button>
      </div>

      {/* Warning if no unpaid prestations */}
      {!hasUnpaidPrestations && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Aucune prestation disponible</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Toutes les prestations sont déjà liées à un paiement encaissé. Créez de nouvelles prestations pour pouvoir créer un paiement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      {paiements.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher par client ou référence..."
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="encaisse">Encaissé</option>
            </select>
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {filteredPaiements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title={searchQuery || filterStatut ? 'Aucun paiement trouvé' : 'Aucun paiement'}
            description={
              searchQuery || filterStatut
                ? 'Aucun paiement ne correspond à vos critères.'
                : 'Commencez par créer votre premier paiement.'
            }
            action={
              !searchQuery && !filterStatut && hasUnpaidPrestations
                ? {
                    label: 'Créer un paiement',
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
            {filteredPaiements.map((paiement) => {
              const actualIndex = paiements.indexOf(paiement);
              const prestationsCount = getPrestationsCount(paiement.reference);
              return (
                <PaiementCard
                  key={actualIndex}
                  paiement={paiement}
                  prestationsCount={prestationsCount}
                  onEdit={() => setEditingPaiement({ paiement, index: actualIndex })}
                  onDelete={() => setDeletingPaiement({ paiement, index: actualIndex })}
                  onGenerateFacture={() => handleGenerateFacture(paiement, actualIndex)}
                  onGenerateRecu={() => handleGenerateRecu(paiement, actualIndex)}
                  isGeneratingFacture={generatingFacture === actualIndex}
                  isGeneratingRecu={generatingRecu === actualIndex}
                />
              );
            })}

            {/* Results count - Mobile */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-700 text-center">
                {filteredPaiements.length} paiement{filteredPaiements.length > 1 ? 's' : ''}
                {(searchQuery || filterStatut) && ` (${paiements.length} au total)`}
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
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prestations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date encaissement
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
                  {filteredPaiements.map((paiement) => {
                    const actualIndex = paiements.indexOf(paiement);
                    const statut = getStatutDisplay(paiement);
                    const prestationsCount = getPrestationsCount(paiement.reference);

                    return (
                      <tr key={actualIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            #{paiement.reference}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{paiement.client}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {prestationsCount} prestation{prestationsCount > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatCurrency(paiement.total)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {paiement.date_encaissement
                              ? formatDateForDisplay(paiement.date_encaissement)
                              : '-'}
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
                                setEditingPaiement({ paiement, index: actualIndex })
                              }
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Modifier
                            </button>
                            {!paiement.date_encaissement && (
                              <button
                                onClick={() =>
                                  setDeletingPaiement({ paiement, index: actualIndex })
                                }
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Supprimer
                              </button>
                            )}
                            <button
                              onClick={() => handleGenerateFacture(paiement, actualIndex)}
                              disabled={generatingFacture === actualIndex}
                              className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {generatingFacture === actualIndex && (
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {generatingFacture === actualIndex ? 'Génération...' : (paiement.facture ? 'Voir Facture' : 'Facture')}
                            </button>
                            {paiement.date_encaissement && (
                              <button
                                onClick={() => handleGenerateRecu(paiement, actualIndex)}
                                disabled={generatingRecu === actualIndex}
                                className="text-purple-600 hover:text-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {generatingRecu === actualIndex && (
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                )}
                                {generatingRecu === actualIndex ? 'Génération...' : (paiement.recu ? 'Voir Reçu' : 'Reçu')}
                              </button>
                            )}
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
                {filteredPaiements.length} paiement{filteredPaiements.length > 1 ? 's' : ''}
                {(searchQuery || filterStatut) && ` (${paiements.length} au total)`}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer un paiement"
        size="lg"
      >
        <PaiementForm
          prestations={prestations}
          onSubmit={handleAdd}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      {editingPaiement && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPaiement(null)}
          title="Modifier le paiement"
          size="md"
        >
          <PaiementForm
            paiement={editingPaiement.paiement}
            prestations={prestations}
            onSubmit={handleEdit}
            onCancel={() => setEditingPaiement(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPaiement && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingPaiement(null)}
          title="Supprimer le paiement"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer le paiement <span className="font-mono font-semibold">#{deletingPaiement.paiement.reference}</span> ?
            </p>
            <p className="text-sm text-gray-600">
              Les prestations liées seront dissociées de ce paiement.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={() => setDeletingPaiement(null)}
                variant="secondary"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
