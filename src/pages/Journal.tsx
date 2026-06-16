/**
 * Journal - Read-only history of every action taken in the app.
 *
 * Presents the audit trail in plain French so a non-technical user can
 * understand what happened, when, and what changed.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import * as sheetsService from '@/services/googleSheets';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useNotification } from '@/contexts/NotificationContext';
import type { JournalLogEntry, JournalAction } from '@/types';
import { formatDateTimeForDisplay } from '@/utils/dateFormatter';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import SearchBar from '@/components/common/SearchBar';
import Button from '@/components/common/Button';

// ---- French presentation helpers ----------------------------------------

const ACTION_LABELS: Record<JournalAction, string> = {
  AJOUT: 'Ajout',
  MODIFICATION: 'Modification',
  SUPPRESSION: 'Suppression',
};

const ACTION_BADGE: Record<JournalAction, string> = {
  AJOUT: 'bg-green-100 text-green-800',
  MODIFICATION: 'bg-blue-100 text-blue-800',
  SUPPRESSION: 'bg-red-100 text-red-800',
};

const ACTION_DOT: Record<JournalAction, string> = {
  AJOUT: 'bg-green-500',
  MODIFICATION: 'bg-blue-500',
  SUPPRESSION: 'bg-red-500',
};

/** Friendly French label for each known entity type */
const ENTITE_LABELS: Record<string, string> = {
  Client: 'Client',
  Prestation: 'Prestation',
  Paiement: 'Paiement',
  Depense: 'Dépense',
  TypePrestation: 'Type de prestation',
};

/** Friendly French label for each known field name */
const FIELD_LABELS: Record<string, string> = {
  nom: 'Nom',
  email: 'Email',
  telephone: 'Téléphone',
  adresse: 'Adresse',
  numero_siret: 'Numéro SIRET',
  date: 'Date',
  nom_client: 'Client',
  type_prestation: 'Type de prestation',
  montant: 'Montant',
  montant_suggere: 'Montant suggéré',
  paiement_id: 'Paiement associé',
  associatif: 'Associatif',
  notes: 'Notes',
  reference: 'Référence',
  client: 'Client',
  total: 'Total',
  date_encaissement: "Date d'encaissement",
  mode_encaissement: "Mode d'encaissement",
  facture: 'Facture',
  recu: 'Reçu',
  compte: 'Compte',
  description: 'Description',
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] || key;
}

function entiteLabel(entite: string): string {
  return ENTITE_LABELS[entite] || entite;
}

/** Render a raw snapshot value in a human-friendly way */
function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(vide)';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  const str = String(value);
  if (str === 'TRUE' || str === 'true') return 'Oui';
  if (str === 'FALSE' || str === 'false') return 'Non';
  return str;
}

interface FieldChange {
  field: string;
  avant: unknown;
  apres: unknown;
}

/** Compute the meaningful field-level changes for an entry */
function getChanges(entry: JournalLogEntry): FieldChange[] {
  const { action, avant, apres } = entry;

  if (action === 'AJOUT' && apres) {
    return Object.entries(apres)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([field, v]) => ({ field, avant: '', apres: v }));
  }

  if (action === 'SUPPRESSION' && avant) {
    return Object.entries(avant)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([field, v]) => ({ field, avant: v, apres: '' }));
  }

  if (action === 'MODIFICATION' && avant && apres) {
    const keys = new Set([...Object.keys(avant), ...Object.keys(apres)]);
    const changes: FieldChange[] = [];
    keys.forEach((field) => {
      const before = avant[field];
      const after = apres[field];
      if (String(before ?? '') !== String(after ?? '')) {
        changes.push({ field, avant: before, apres: after });
      }
    });
    return changes;
  }

  return [];
}

/** Group entries by calendar day (newest day first; entries already newest-first) */
function groupByDay(entries: JournalLogEntry[]): { key: string; label: string; entries: JournalLogEntry[] }[] {
  const groups: { key: string; label: string; entries: JournalLogEntry[] }[] = [];
  const byKey = new Map<string, JournalLogEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.timestamp);
    const key = isNaN(date.getTime())
      ? 'inconnu'
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(entry);
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  for (const [key, groupEntries] of byKey) {
    let label: string;
    if (key === todayKey) {
      label = "Aujourd'hui";
    } else if (key === yesterdayKey) {
      label = 'Hier';
    } else {
      const d = new Date(groupEntries[0].timestamp);
      label = isNaN(d.getTime())
        ? 'Date inconnue'
        : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    groups.push({ key, label, entries: groupEntries });
  }

  return groups;
}

type ActionFilter = 'tous' | JournalAction;

export default function Journal() {
  const { isAuthenticated } = useAuth();
  const { isConfigured } = useConfig();
  const { error: notifyError } = useNotification();

  const [entries, setEntries] = useState<JournalLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('tous');
  const [entiteFilter, setEntiteFilter] = useState<string>('tous');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const loadJournal = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await sheetsService.getJournal();
      if (response.error) throw new Error(response.error);
      setEntries(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger le journal';
      notifyError(message);
    } finally {
      setIsLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    if (isAuthenticated && isConfigured) {
      loadJournal();
    }
  }, [isAuthenticated, isConfigured, loadJournal]);

  // Entity types actually present, for the filter dropdown
  const entiteOptions = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.entite && set.add(e.entite));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((e) => {
      if (actionFilter !== 'tous' && e.action !== actionFilter) return false;
      if (entiteFilter !== 'tous' && e.entite !== entiteFilter) return false;
      if (q) {
        const haystack = `${e.description} ${e.identifiant} ${entiteLabel(e.entite)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, searchQuery, actionFilter, entiteFilter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" message="Chargement du journal..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Journal d'activité</h1>
        <Button onClick={loadJournal} variant="secondary">
          Actualiser
        </Button>
      </div>
      <p className="text-gray-600 mb-6">
        Retrouvez ici l'historique de toutes les actions effectuées : ajouts, modifications et suppressions.
      </p>

      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <EmptyState
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Aucune activité enregistrée"
            description="Les actions que vous effectuerez dans l'application apparaîtront ici."
          />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher dans le journal..."
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="tous">Toutes les actions</option>
                <option value="AJOUT">Ajouts</option>
                <option value="MODIFICATION">Modifications</option>
                <option value="SUPPRESSION">Suppressions</option>
              </select>
              <select
                value={entiteFilter}
                onChange={(e) => setEntiteFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="tous">Tous les éléments</option>
                {entiteOptions.map((ent) => (
                  <option key={ent} value={ent}>
                    {entiteLabel(ent)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <EmptyState
                title="Aucun résultat"
                description="Aucune action ne correspond à votre recherche."
              />
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group.key}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 first-letter:uppercase">
                    {group.label}
                  </h2>
                  <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
                    {group.entries.map((entry) => {
                      // Stable index into the filtered list for expand state
                      const globalIndex = filtered.indexOf(entry);
                      const changes = getChanges(entry);
                      const isOpen = expanded.has(globalIndex);
                      return (
                        <div key={globalIndex} className="p-4">
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${ACTION_DOT[entry.action]}`}
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_BADGE[entry.action]}`}
                                >
                                  {ACTION_LABELS[entry.action]}
                                </span>
                                <span className="text-xs text-gray-500">{entiteLabel(entry.entite)}</span>
                                <span className="text-xs text-gray-400">
                                  · {formatDateTimeForDisplay(entry.timestamp)}
                                </span>
                              </div>
                              <p className="text-gray-900">{entry.description}</p>

                              {changes.length > 0 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(globalIndex)}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {isOpen ? 'Masquer les détails' : 'Voir les détails'}
                                  </button>

                                  {isOpen && (
                                    <div className="mt-3 rounded-lg bg-gray-50 p-3 space-y-2">
                                      {changes.map((change) => (
                                        <div key={change.field} className="text-sm">
                                          <span className="font-medium text-gray-700">
                                            {fieldLabel(change.field)} :
                                          </span>{' '}
                                          {entry.action === 'MODIFICATION' ? (
                                            <span className="text-gray-600">
                                              <span className="line-through text-gray-400">
                                                {displayValue(change.avant)}
                                              </span>{' '}
                                              → <span className="text-gray-900">{displayValue(change.apres)}</span>
                                            </span>
                                          ) : (
                                            <span className="text-gray-900">
                                              {displayValue(
                                                entry.action === 'SUPPRESSION' ? change.avant : change.apres
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
