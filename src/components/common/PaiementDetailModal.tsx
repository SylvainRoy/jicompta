/**
 * Paiement Detail Modal - Shows payment details with associated prestations
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Paiement, Prestation } from '@/types';
import Modal from './Modal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDateForDisplay } from '@/utils/dateFormatter';
import { ROUTES } from '@/constants';

interface PaiementDetailModalProps {
  paiement: Paiement;
  prestations: Prestation[];
  isOpen: boolean;
  onClose: () => void;
}

export default function PaiementDetailModal({
  paiement,
  prestations,
  isOpen,
  onClose,
}: PaiementDetailModalProps) {
  const navigate = useNavigate();

  // Filter prestations for this payment
  const associatedPrestations = useMemo(() => {
    return prestations.filter((p) => p.paiement_id === paiement.reference);
  }, [prestations, paiement.reference]);

  const handlePrestationClick = (prestation: Prestation) => {
    // Navigate to Prestations page with the prestation's row number as a highlight parameter
    // Close the modal first
    onClose();

    // Navigate with query params to identify the prestation
    navigate(`${ROUTES.PRESTATIONS}?highlight=${prestation._rowNumber ?? ''}&date=${prestation.date}&client=${encodeURIComponent(prestation.nom_client)}`);
  };

  const isEncaisse = !!paiement.date_encaissement;
  const statusLabel = isEncaisse ? 'Encaissé' : 'En attente';
  const statusColor = isEncaisse
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails du paiement" size="lg">
      <div className="space-y-6">
        {/* Payment Header Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">#{paiement.reference}</h3>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Client:</span>
              <span className="ml-2 font-medium text-gray-900">{paiement.client}</span>
            </div>

            <div>
              <span className="text-gray-600">Montant total:</span>
              <span className="ml-2 font-semibold text-blue-600">
                {formatCurrency(paiement.total)}
              </span>
            </div>

            {paiement.date_encaissement && (
              <div>
                <span className="text-gray-600">Date d'encaissement:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDateForDisplay(paiement.date_encaissement)}
                </span>
              </div>
            )}

            {paiement.mode_encaissement && (
              <div>
                <span className="text-gray-600">Mode:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">
                  {paiement.mode_encaissement}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {paiement.notes && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-600 text-sm">Notes:</span>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{paiement.notes}</p>
            </div>
          )}

          {/* PDF Links */}
          {(paiement.facture || paiement.recu) && (
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              {paiement.facture && (
                <a
                  href={paiement.facture}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Voir la facture
                </a>
              )}
              {paiement.recu && (
                <a
                  href={paiement.recu}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Voir le reçu
                </a>
              )}
            </div>
          )}
        </div>

        {/* Associated Prestations */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Prestations associées ({associatedPrestations.length})
          </h4>

          {associatedPrestations.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-700">
                Aucune prestation associée à ce paiement
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {associatedPrestations.map((prestation, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePrestationClick(prestation)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {prestation.type_prestation}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateForDisplay(prestation.date)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {prestation.nom_client}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-600">
                        {formatCurrency(prestation.montant)}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
