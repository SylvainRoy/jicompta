/**
 * Database audit
 * Checks the consistency of all data loaded from the Google Sheets database.
 * Pure functions — no API calls, easily testable.
 */

import type { Client, TypePrestation, Prestation, Paiement, Depense } from '@/types';
import { MON_COMPTE, MODES_ENCAISSEMENT } from '@/constants';
import { isValidISODate, getTodayISO, formatDateForDisplay } from '@/utils/dateFormatter';
import { isValidEmail, isValidSIRET } from '@/utils/validators';
import { formatCurrency } from '@/utils/currencyFormatter';

export type AuditSeverity = 'erreur' | 'avertissement';

export interface AuditIssue {
  severity: AuditSeverity;
  categorie: string;
  message: string;
}

export interface AuditData {
  clients: Client[];
  typesPrestations: TypePrestation[];
  prestations: Prestation[];
  paiements: Paiement[];
  depenses: Depense[];
}

const CATEGORIES = {
  REFERENCES: 'Références croisées',
  DOUBLONS: 'Doublons',
  COHERENCE: 'Cohérence des paiements',
  FORMATS: 'Formats et champs obligatoires',
  COMPTES: 'Comptes',
} as const;

/** Strict YYYY-MM-DD check — isValidISODate accepts anything new Date() can parse */
function isStrictISODate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && isValidISODate(date);
}

function erreur(categorie: string, message: string): AuditIssue {
  return { severity: 'erreur', categorie, message };
}

function avertissement(categorie: string, message: string): AuditIssue {
  return { severity: 'avertissement', categorie, message };
}

function prestationLabel(p: Prestation): string {
  return `Prestation du ${formatDateForDisplay(p.date)} (${p.nom_client} - ${p.type_prestation})`;
}

/** Find values appearing more than once, with their count */
function findDuplicates(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  return new Map([...counts].filter(([, count]) => count > 1));
}

/**
 * Run all consistency checks on the database.
 * Returns the list of issues found (empty = database is consistent).
 */
export function auditDatabase(data: AuditData): AuditIssue[] {
  const { clients, typesPrestations, prestations, paiements, depenses } = data;
  const issues: AuditIssue[] = [];

  const clientNames = new Set(clients.map((c) => c.nom));
  const typeNames = new Set(typesPrestations.map((t) => t.nom));
  const paiementRefs = new Set(paiements.map((p) => p.reference));
  const today = getTodayISO();

  // ============================================
  // Références croisées
  // ============================================

  prestations.forEach((p) => {
    if (p.nom_client && !clientNames.has(p.nom_client)) {
      issues.push(erreur(CATEGORIES.REFERENCES,
        `${prestationLabel(p)}: le client "${p.nom_client}" n'existe pas`));
    }
    if (p.type_prestation && !typeNames.has(p.type_prestation)) {
      issues.push(erreur(CATEGORIES.REFERENCES,
        `${prestationLabel(p)}: le type de prestation "${p.type_prestation}" n'existe pas`));
    }
    if (p.paiement_id && !paiementRefs.has(p.paiement_id)) {
      issues.push(erreur(CATEGORIES.REFERENCES,
        `${prestationLabel(p)}: le paiement "${p.paiement_id}" n'existe pas`));
    }
  });

  paiements.forEach((p) => {
    if (p.client && !clientNames.has(p.client)) {
      issues.push(erreur(CATEGORIES.REFERENCES,
        `Paiement ${p.reference}: le client "${p.client}" n'existe pas`));
    }
  });

  depenses.forEach((d) => {
    if (d.compte && d.compte !== MON_COMPTE && !clientNames.has(d.compte)) {
      issues.push(erreur(CATEGORIES.REFERENCES,
        `Dépense du ${formatDateForDisplay(d.date)} (${d.description}): le compte "${d.compte}" n'existe pas`));
    }
  });

  // Every payment must be referenced by at least one prestation
  const referencedPaiements = new Set(
    prestations.filter((p) => p.paiement_id).map((p) => p.paiement_id)
  );
  paiements.forEach((p) => {
    if (!referencedPaiements.has(p.reference)) {
      issues.push(erreur(CATEGORIES.REFERENCES,
        `Paiement ${p.reference} (${p.client}, ${formatCurrency(p.total)}): aucune prestation ne lui est liée`));
    }
  });

  // ============================================
  // Doublons
  // ============================================

  findDuplicates(clients.map((c) => c.nom.trim()).filter(Boolean)).forEach((count, nom) => {
    issues.push(erreur(CATEGORIES.DOUBLONS, `Client "${nom}" présent ${count} fois`));
  });

  findDuplicates(typesPrestations.map((t) => t.nom.trim()).filter(Boolean)).forEach((count, nom) => {
    issues.push(erreur(CATEGORIES.DOUBLONS, `Type de prestation "${nom}" présent ${count} fois`));
  });

  findDuplicates(paiements.map((p) => p.reference.trim()).filter(Boolean)).forEach((count, ref) => {
    issues.push(erreur(CATEGORIES.DOUBLONS, `Référence de paiement "${ref}" présente ${count} fois`));
  });

  // The same prestation cannot be given twice to the same client on the same day (unless notes differ)
  findDuplicates(
    prestations
      .filter((p) => p.date && p.nom_client && p.type_prestation)
      .map((p) => `${p.date}|${p.nom_client}|${p.type_prestation}|${(p.notes || '').trim()}`)
  ).forEach((count, key) => {
    const parts = key.split('|');
    const date = parts[0];
    const nomClient = parts[1];
    const type = parts[2];
    issues.push(erreur(CATEGORIES.DOUBLONS,
      `Prestation "${type}" pour ${nomClient} présente ${count} fois le ${formatDateForDisplay(date)}`));
  });

  findDuplicates(
    depenses.map((d) => `${d.date}|${d.compte}|${d.montant}|${d.description}`)
  ).forEach((count, key) => {
    const [date, compte, montant, description] = key.split('|');
    issues.push(avertissement(CATEGORIES.DOUBLONS,
      `Dépense "${description}" (${compte}, ${formatCurrency(Number(montant))}) présente ${count} fois le ${formatDateForDisplay(date)}`));
  });

  // ============================================
  // Cohérence des paiements
  // ============================================

  paiements.forEach((pmt) => {
    const linked = prestations.filter((p) => p.paiement_id === pmt.reference);

    // Total must match the sum of linked prestations
    if (linked.length > 0) {
      const sum = linked.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
      if (Math.abs(sum - (Number(pmt.total) || 0)) > 0.005) {
        issues.push(erreur(CATEGORIES.COHERENCE,
          `Paiement ${pmt.reference}: total ${formatCurrency(pmt.total)} différent de la somme des prestations liées ${formatCurrency(sum)}`));
      }
    }

    // Linked prestations must belong to the same client as the payment
    linked.forEach((p) => {
      if (p.nom_client !== pmt.client) {
        issues.push(erreur(CATEGORIES.COHERENCE,
          `Paiement ${pmt.reference} (client "${pmt.client}"): la ${prestationLabel(p).toLowerCase()} appartient à un autre client`));
      }
    });

    if (pmt.date_encaissement && !pmt.mode_encaissement) {
      issues.push(avertissement(CATEGORIES.COHERENCE,
        `Paiement ${pmt.reference}: encaissé le ${formatDateForDisplay(pmt.date_encaissement)} sans mode d'encaissement`));
    }

    if (pmt.mode_encaissement && !MODES_ENCAISSEMENT.some((m) => m.value === pmt.mode_encaissement)) {
      issues.push(avertissement(CATEGORIES.COHERENCE,
        `Paiement ${pmt.reference}: mode d'encaissement inconnu "${pmt.mode_encaissement}"`));
    }
  });

  // Associative prestations must not be linked to a payment
  prestations.forEach((p) => {
    if (p.associatif && p.paiement_id) {
      issues.push(erreur(CATEGORIES.COHERENCE,
        `${prestationLabel(p)}: une prestation associative ne peut pas être liée à un paiement (${p.paiement_id})`));
    }
  });

  // ============================================
  // Formats et champs obligatoires
  // ============================================

  clients.forEach((c, i) => {
    if (!c.nom || !c.nom.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `Client n°${i + 1}: nom manquant`));
    }
    if (c.email && !isValidEmail(c.email)) {
      issues.push(avertissement(CATEGORIES.FORMATS, `Client "${c.nom}": email invalide "${c.email}"`));
    }
    if (c.numero_siret && !isValidSIRET(c.numero_siret)) {
      issues.push(avertissement(CATEGORIES.FORMATS, `Client "${c.nom}": SIRET invalide "${c.numero_siret}"`));
    }
  });

  typesPrestations.forEach((t, i) => {
    if (!t.nom || !t.nom.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `Type de prestation n°${i + 1}: nom manquant`));
    }
    if (Number.isNaN(Number(t.montant_suggere)) || Number(t.montant_suggere) < 0) {
      issues.push(avertissement(CATEGORIES.FORMATS,
        `Type de prestation "${t.nom}": montant suggéré invalide (${t.montant_suggere})`));
    }
  });

  prestations.forEach((p, i) => {
    const label = p.date && p.nom_client ? prestationLabel(p) : `Prestation n°${i + 1}`;
    if (!p.date || !isStrictISODate(p.date)) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: date invalide "${p.date}"`));
    } else if (p.date > today) {
      issues.push(avertissement(CATEGORIES.FORMATS, `${label}: date dans le futur`));
    }
    if (!p.nom_client || !p.nom_client.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: client manquant`));
    }
    if (!p.type_prestation || !p.type_prestation.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: type de prestation manquant`));
    }
    if (Number.isNaN(Number(p.montant)) || Number(p.montant) <= 0) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: montant invalide (${p.montant})`));
    }
  });

  paiements.forEach((p, i) => {
    const label = p.reference ? `Paiement ${p.reference}` : `Paiement n°${i + 1}`;
    if (!p.reference || !p.reference.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: référence manquante`));
    }
    if (!p.client || !p.client.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: client manquant`));
    }
    if (Number.isNaN(Number(p.total)) || Number(p.total) <= 0) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: total invalide (${p.total})`));
    }
    if (p.date_encaissement) {
      if (!isStrictISODate(p.date_encaissement)) {
        issues.push(erreur(CATEGORIES.FORMATS, `${label}: date d'encaissement invalide "${p.date_encaissement}"`));
      } else if (p.date_encaissement > today) {
        issues.push(avertissement(CATEGORIES.FORMATS, `${label}: date d'encaissement dans le futur`));
      }
    }
  });

  depenses.forEach((d, i) => {
    const label = d.description ? `Dépense "${d.description}"` : `Dépense n°${i + 1}`;
    if (!d.date || !isStrictISODate(d.date)) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: date invalide "${d.date}"`));
    } else if (d.date > today) {
      issues.push(avertissement(CATEGORIES.FORMATS, `${label}: date dans le futur`));
    }
    if (!d.compte || !d.compte.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: compte manquant`));
    }
    if (!d.description || !d.description.trim()) {
      issues.push(erreur(CATEGORIES.FORMATS, `Dépense du ${formatDateForDisplay(d.date)}: description manquante`));
    }
    if (Number.isNaN(Number(d.montant)) || Number(d.montant) <= 0) {
      issues.push(erreur(CATEGORIES.FORMATS, `${label}: montant invalide (${d.montant})`));
    }
  });

  // ============================================
  // Comptes
  // ============================================

  // Negative balance on an associative client account: more expenses than credits
  clients.forEach((client) => {
    const credits = prestations
      .filter((p) => p.nom_client === client.nom && p.associatif)
      .reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
    const debits = depenses
      .filter((d) => d.compte === client.nom)
      .reduce((sum, d) => sum + (Number(d.montant) || 0), 0);
    if (credits > 0 || debits > 0) {
      const balance = credits - debits;
      if (balance < -0.005) {
        issues.push(avertissement(CATEGORIES.COMPTES,
          `Compte "${client.nom}": solde négatif (${formatCurrency(balance)})`));
      }
    }
  });

  return issues;
}
