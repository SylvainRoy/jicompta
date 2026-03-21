/**
 * Clients Page - Complete CRUD
 */

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import type { Client } from '@/types';
import Button from '@/components/common/Button';
import Modal, { ConfirmModal } from '@/components/common/Modal';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import Loading from '@/components/common/Loading';
import ClientForm from '@/components/forms/ClientForm';
import ClientCard from '@/components/common/ClientCard';

export default function Clients() {
  const { clients, isLoading, addClient, updateClient, deleteClient } = useData();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<{ client: Client; index: number } | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Filtered clients based on search
  const filteredClients = useMemo(() => {
    let filtered = searchQuery.trim()
      ? clients.filter((client) => {
          const query = searchQuery.toLowerCase();
          return (
            client.nom.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query) ||
            client.telephone?.toLowerCase().includes(query) ||
            client.numero_siret?.toLowerCase().includes(query)
          );
        })
      : clients;

    // Reverse order to show newest first (last added = most recent)
    return [...filtered].reverse();
  }, [clients, searchQuery]);

  // Handlers
  const handleAdd = async (client: Client) => {
    await addClient(client);
    setIsAddModalOpen(false);
  };

  const handleEdit = async (client: Client) => {
    if (editingClient) {
      await updateClient(editingClient.index, client);
      setEditingClient(null);
    }
  };

  const handleDelete = async () => {
    if (deletingIndex !== null) {
      try {
        await deleteClient(deletingIndex);
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
        <Loading size="lg" message="Chargement des clients..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Clients</h1>
        <Button onClick={() => setIsAddModalOpen(true)} variant="primary" className="w-full sm:w-auto">
          + Ajouter un client
        </Button>
      </div>

      {/* Search Bar */}
      {clients.length > 0 && (
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par nom, email, téléphone ou SIRET..."
          />
        </div>
      )}

      {/* Table or Empty State */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title={searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
            description={
              searchQuery
                ? 'Aucun client ne correspond à votre recherche.'
                : 'Commencez par ajouter votre premier client.'
            }
            action={
              !searchQuery
                ? {
                    label: 'Ajouter un client',
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
            {filteredClients.map((client) => {
              const actualIndex = clients.indexOf(client);
              return (
                <ClientCard
                  key={actualIndex}
                  client={client}
                  onEdit={() => setEditingClient({ client, index: actualIndex })}
                  onDelete={() => setDeletingIndex(actualIndex)}
                />
              );
            })}

            {/* Results count - Mobile */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-700 text-center">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                {searchQuery && ` (${clients.length} au total)`}
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
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SIRET
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const actualIndex = clients.indexOf(client);

                    return (
                      <tr key={actualIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.nom}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{client.telephone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{client.numero_siret || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditingClient({ client, index: actualIndex })}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="Modifier"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingIndex(actualIndex)}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                {searchQuery && ` (${clients.length} au total)`}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un client"
        size="md"
      >
        <ClientForm onSubmit={handleAdd} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      {editingClient && (
        <Modal
          isOpen={true}
          onClose={() => setEditingClient(null)}
          title="Modifier le client"
          size="md"
        >
          <ClientForm
            client={editingClient.client}
            onSubmit={handleEdit}
            onCancel={() => setEditingClient(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deletingIndex !== null}
        onClose={() => setDeletingIndex(null)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer le client "${
          deletingIndex !== null ? clients[deletingIndex]?.nom : ''
        }" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
