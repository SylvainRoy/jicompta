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

export interface AuditCheckResult {
  id: string;
  categorie: string;
  title: string;
  status: 'succes' | 'avertissement' | 'erreur';
  issues: AuditIssue[];
}

export interface AuditCategoryReport {
  categorie: string;
  status: 'succes' | 'avertissement' | 'erreur';
  checks: AuditCheckResult[];
}

export interface AuditReport {
  issues: AuditIssue[];
  categories: AuditCategoryReport[];
  totalChecks: number;
  passedChecks: number;
  errorCount: number;
  warningCount: number;
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

interface CheckBucket {
  id: string;
  categorie: string;
  title: string;
  issues: AuditIssue[];
}

function createCheck(id: string, categorie: string, title: string): CheckBucket {
  return { id, categorie, title, issues: [] };
}

/**
 * Run all consistency checks on the database and generate a full audit report detailing each check.
 */
export function auditDatabaseReport(data: AuditData): AuditReport {
  const { clients, typesPrestations, prestations, paiements, depenses } = data;
  const flatIssues: AuditIssue[] = [];

  const clientNames = new Set(clients.map((c) => c.nom));
  const typeNames = new Set(typesPrestations.map((t) => t.nom));
  const paiementRefs = new Set(paiements.map((p) => p.reference));
  const today = getTodayISO();

  const addIssue = (check: CheckBucket, issue: AuditIssue) => {
    check.issues.push(issue);
    flatIssues.push(issue);
  };

  // ============================================
  // Références croisées
  // ============================================
  const chkRefClient = createCheck('ref_client', CATEGORIES.REFERENCES, 'Existence des clients (prestations, paiements, dépenses)');
  const chkRefType = createCheck('ref_type', CATEGORIES.REFERENCES, 'Existence des types de prestations');
  const chkRefPaiement = createCheck('ref_paiement', CATEGORIES.REFERENCES, 'Existence des paiements rattachés aux prestations');
  const chkRefCompte = createCheck('ref_compte', CATEGORIES.REFERENCES, 'Existence des comptes de dépenses');
  const chkRefOrphelin = createCheck('ref_orphelin', CATEGORIES.REFERENCES, 'Rattachement des paiements à au moins une prestation');

  prestations.forEach((p) => {
    if (p.nom_client && !clientNames.has(p.nom_client)) {
      addIssue(chkRefClient, erreur(CATEGORIES.REFERENCES, `${prestationLabel(p)}: le client "${p.nom_client}" n'existe pas`));
    }
    if (p.type_prestation && !typeNames.has(p.type_prestation)) {
      addIssue(chkRefType, erreur(CATEGORIES.REFERENCES, `${prestationLabel(p)}: le type de prestation "${p.type_prestation}" n'existe pas`));
    }
    if (p.paiement_id && !paiementRefs.has(p.paiement_id)) {
      addIssue(chkRefPaiement, erreur(CATEGORIES.REFERENCES, `${prestationLabel(p)}: le paiement "${p.paiement_id}" n'existe pas`));
    }
  });

  paiements.forEach((p) => {
    if (p.client && !clientNames.has(p.client)) {
      addIssue(chkRefClient, erreur(CATEGORIES.REFERENCES, `Paiement ${p.reference}: le client "${p.client}" n'existe pas`));
    }
  });

  depenses.forEach((d) => {
    if (d.compte && d.compte !== MON_COMPTE && !clientNames.has(d.compte)) {
      addIssue(chkRefCompte, erreur(CATEGORIES.REFERENCES, `Dépense du ${formatDateForDisplay(d.date)} (${d.description}): le compte "${d.compte}" n'existe pas`));
    }
  });

  const referencedPaiements = new Set(
    prestations.filter((p) => p.paiement_id).map((p) => p.paiement_id)
  );
  paiements.forEach((p) => {
    if (!referencedPaiements.has(p.reference)) {
      addIssue(chkRefOrphelin, erreur(CATEGORIES.REFERENCES, `Paiement ${p.reference} (${p.client}, ${formatCurrency(p.total)}): aucune prestation ne lui est liée`));
    }
  });

  // ============================================
  // Doublons
  // ============================================
  const chkDupClient = createCheck('dup_client', CATEGORIES.DOUBLONS, 'Unicité des fiches clients');
  const chkDupType = createCheck('dup_type', CATEGORIES.DOUBLONS, 'Unicité des types de prestations');
  const chkDupPaiement = createCheck('dup_paiement', CATEGORIES.DOUBLONS, 'Unicité des références de paiements');
  const chkDupPrestation = createCheck('dup_prestation', CATEGORIES.DOUBLONS, 'Absence de prestations en double');
  const chkDupDepense = createCheck('dup_depense', CATEGORIES.DOUBLONS, 'Absence de dépenses en double');

  findDuplicates(clients.map((c) => c.nom.trim()).filter(Boolean)).forEach((count, nom) => {
    addIssue(chkDupClient, erreur(CATEGORIES.DOUBLONS, `Client "${nom}" présent ${count} fois`));
  });

  findDuplicates(typesPrestations.map((t) => t.nom.trim()).filter(Boolean)).forEach((count, nom) => {
    addIssue(chkDupType, erreur(CATEGORIES.DOUBLONS, `Type de prestation "${nom}" présent ${count} fois`));
  });

  findDuplicates(paiements.map((p) => p.reference.trim()).filter(Boolean)).forEach((count, ref) => {
    addIssue(chkDupPaiement, erreur(CATEGORIES.DOUBLONS, `Référence de paiement "${ref}" présente ${count} fois`));
  });

  findDuplicates(
    prestations
      .filter((p) => p.date && p.nom_client && p.type_prestation)
      .map((p) => `${p.date}|${p.nom_client}|${p.type_prestation}|${(p.notes || '').trim()}`)
  ).forEach((count, key) => {
    const parts = key.split('|');
    const date = parts[0];
    const nomClient = parts[1];
    const type = parts[2];
    addIssue(chkDupPrestation, erreur(CATEGORIES.DOUBLONS, `Prestation "${type}" pour ${nomClient} présente ${count} fois le ${formatDateForDisplay(date)}`));
  });

  findDuplicates(
    depenses.map((d) => `${d.date}|${d.compte}|${d.montant}|${d.description}`)
  ).forEach((count, key) => {
    const [date, compte, montant, description] = key.split('|');
    addIssue(chkDupDepense, avertissement(CATEGORIES.DOUBLONS, `Dépense "${description}" (${compte}, ${formatCurrency(Number(montant))}) présente ${count} fois le ${formatDateForDisplay(date)}`));
  });

  // ============================================
  // Cohérence des paiements
  // ============================================
  const chkCohMontant = createCheck('coh_montant', CATEGORIES.COHERENCE, 'Concordance du total des paiements avec la somme des prestations');
  const chkCohClient = createCheck('coh_client', CATEGORIES.COHERENCE, 'Concordance du client des prestations liées au paiement');
  const chkCohMode = createCheck('coh_mode', CATEGORIES.COHERENCE, 'Présence et validité du mode d\'encaissement');
  const chkCohAssociatif = createCheck('coh_associatif', CATEGORIES.COHERENCE, 'Non-rattachement des prestations associatives à un paiement');

  paiements.forEach((pmt) => {
    const linked = prestations.filter((p) => p.paiement_id === pmt.reference);

    if (linked.length > 0) {
      const sum = linked.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
      if (Math.abs(sum - (Number(pmt.total) || 0)) > 0.005) {
        addIssue(chkCohMontant, erreur(CATEGORIES.COHERENCE, `Paiement ${pmt.reference}: total ${formatCurrency(pmt.total)} différent de la somme des prestations liées ${formatCurrency(sum)}`));
      }
    }

    linked.forEach((p) => {
      if (p.nom_client !== pmt.client) {
        addIssue(chkCohClient, erreur(CATEGORIES.COHERENCE, `Paiement ${pmt.reference} (client "${pmt.client}"): la ${prestationLabel(p).toLowerCase()} appartient à un autre client`));
      }
    });

    if (pmt.date_encaissement && !pmt.mode_encaissement) {
      addIssue(chkCohMode, avertissement(CATEGORIES.COHERENCE, `Paiement ${pmt.reference}: encaissé le ${formatDateForDisplay(pmt.date_encaissement)} sans mode d'encaissement`));
    }

    if (pmt.mode_encaissement && !MODES_ENCAISSEMENT.some((m) => m.value === pmt.mode_encaissement)) {
      addIssue(chkCohMode, avertissement(CATEGORIES.COHERENCE, `Paiement ${pmt.reference}: mode d'encaissement inconnu "${pmt.mode_encaissement}"`));
    }
  });

  prestations.forEach((p) => {
    if (p.associatif && p.paiement_id) {
      addIssue(chkCohAssociatif, erreur(CATEGORIES.COHERENCE, `${prestationLabel(p)}: une prestation associative ne peut pas être liée à un paiement (${p.paiement_id})`));
    }
  });

  // ============================================
  // Formats et champs obligatoires
  // ============================================
  const chkFmtClient = createCheck('fmt_client', CATEGORIES.FORMATS, 'Validité des fiches clients (noms, emails, SIRET)');
  const chkFmtType = createCheck('fmt_type', CATEGORIES.FORMATS, 'Validité des types de prestations (noms, montants suggérés)');
  const chkFmtPrestation = createCheck('fmt_prestation', CATEGORIES.FORMATS, 'Validité des prestations (dates ISO, champs obligatoires, montants)');
  const chkFmtPaiement = createCheck('fmt_paiement', CATEGORIES.FORMATS, 'Validité des paiements (références, clients, montants, dates)');
  const chkFmtDepense = createCheck('fmt_depense', CATEGORIES.FORMATS, 'Validité des dépenses (dates ISO, comptes, descriptions, montants)');

  clients.forEach((c, i) => {
    if (!c.nom || !c.nom.trim()) {
      addIssue(chkFmtClient, erreur(CATEGORIES.FORMATS, `Client n°${i + 1}: nom manquant`));
    }
    if (c.email && !isValidEmail(c.email)) {
      addIssue(chkFmtClient, avertissement(CATEGORIES.FORMATS, `Client "${c.nom}": email invalide "${c.email}"`));
    }
    if (c.numero_siret && !isValidSIRET(c.numero_siret)) {
      addIssue(chkFmtClient, avertissement(CATEGORIES.FORMATS, `Client "${c.nom}": SIRET invalide "${c.numero_siret}"`));
    }
  });

  typesPrestations.forEach((t, i) => {
    if (!t.nom || !t.nom.trim()) {
      addIssue(chkFmtType, erreur(CATEGORIES.FORMATS, `Type de prestation n°${i + 1}: nom manquant`));
    }
    if (Number.isNaN(Number(t.montant_suggere)) || Number(t.montant_suggere) < 0) {
      addIssue(chkFmtType, avertissement(CATEGORIES.FORMATS, `Type de prestation "${t.nom}": montant suggéré invalide (${t.montant_suggere})`));
    }
  });

  prestations.forEach((p, i) => {
    const label = p.date && p.nom_client ? prestationLabel(p) : `Prestation n°${i + 1}`;
    if (!p.date || !isStrictISODate(p.date)) {
      addIssue(chkFmtPrestation, erreur(CATEGORIES.FORMATS, `${label}: date invalide "${p.date}"`));
    } else if (p.date > today) {
      addIssue(chkFmtPrestation, avertissement(CATEGORIES.FORMATS, `${label}: date dans le futur`));
    }
    if (!p.nom_client || !p.nom_client.trim()) {
      addIssue(chkFmtPrestation, erreur(CATEGORIES.FORMATS, `${label}: client manquant`));
    }
    if (!p.type_prestation || !p.type_prestation.trim()) {
      addIssue(chkFmtPrestation, erreur(CATEGORIES.FORMATS, `${label}: type de prestation manquant`));
    }
    if (Number.isNaN(Number(p.montant)) || Number(p.montant) <= 0) {
      addIssue(chkFmtPrestation, erreur(CATEGORIES.FORMATS, `${label}: montant invalide (${p.montant})`));
    }
  });

  paiements.forEach((p, i) => {
    const label = p.reference ? `Paiement ${p.reference}` : `Paiement n°${i + 1}`;
    if (!p.reference || !p.reference.trim()) {
      addIssue(chkFmtPaiement, erreur(CATEGORIES.FORMATS, `${label}: référence manquante`));
    }
    if (!p.client || !p.client.trim()) {
      addIssue(chkFmtPaiement, erreur(CATEGORIES.FORMATS, `${label}: client manquant`));
    }
    if (Number.isNaN(Number(p.total)) || Number(p.total) <= 0) {
      addIssue(chkFmtPaiement, erreur(CATEGORIES.FORMATS, `${label}: total invalide (${p.total})`));
    }
    if (p.date_encaissement) {
      if (!isStrictISODate(p.date_encaissement)) {
        addIssue(chkFmtPaiement, erreur(CATEGORIES.FORMATS, `${label}: date d'encaissement invalide "${p.date_encaissement}"`));
      } else if (p.date_encaissement > today) {
        addIssue(chkFmtPaiement, avertissement(CATEGORIES.FORMATS, `${label}: date d'encaissement dans le futur`));
      }
    }
  });

  depenses.forEach((d, i) => {
    const label = d.description ? `Dépense "${d.description}"` : `Dépense n°${i + 1}`;
    if (!d.date || !isStrictISODate(d.date)) {
      addIssue(chkFmtDepense, erreur(CATEGORIES.FORMATS, `${label}: date invalide "${d.date}"`));
    } else if (d.date > today) {
      addIssue(chkFmtDepense, avertissement(CATEGORIES.FORMATS, `${label}: date dans le futur`));
    }
    if (!d.compte || !d.compte.trim()) {
      addIssue(chkFmtDepense, erreur(CATEGORIES.FORMATS, `${label}: compte manquant`));
    }
    if (!d.description || !d.description.trim()) {
      addIssue(chkFmtDepense, erreur(CATEGORIES.FORMATS, `Dépense du ${formatDateForDisplay(d.date)}: description manquante`));
    }
    if (Number.isNaN(Number(d.montant)) || Number(d.montant) <= 0) {
      addIssue(chkFmtDepense, erreur(CATEGORIES.FORMATS, `${label}: montant invalide (${d.montant})`));
    }
  });

  // ============================================
  // Comptes
  // ============================================
  const chkCompteSolde = createCheck('compte_solde', CATEGORIES.COMPTES, 'Solde des comptes clients associatifs');

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
        addIssue(chkCompteSolde, avertissement(CATEGORIES.COMPTES, `Compte "${client.nom}": solde négatif (${formatCurrency(balance)})`));
      }
    }
  });

  const allBuckets: CheckBucket[] = [
    chkRefClient, chkRefType, chkRefPaiement, chkRefCompte, chkRefOrphelin,
    chkDupClient, chkDupType, chkDupPaiement, chkDupPrestation, chkDupDepense,
    chkCohMontant, chkCohClient, chkCohMode, chkCohAssociatif,
    chkFmtClient, chkFmtType, chkFmtPrestation, chkFmtPaiement, chkFmtDepense,
    chkCompteSolde,
  ];

  const categoryOrder = [
    CATEGORIES.REFERENCES,
    CATEGORIES.DOUBLONS,
    CATEGORIES.COHERENCE,
    CATEGORIES.FORMATS,
    CATEGORIES.COMPTES,
  ];

  let passedChecks = 0;
  let errorCount = 0;
  let warningCount = 0;

  const checkResults: AuditCheckResult[] = allBuckets.map((bucket) => {
    const hasError = bucket.issues.some((i) => i.severity === 'erreur');
    const hasWarning = bucket.issues.some((i) => i.severity === 'avertissement');
    let status: 'succes' | 'avertissement' | 'erreur' = 'succes';

    if (hasError) {
      status = 'erreur';
    } else if (hasWarning) {
      status = 'avertissement';
    } else {
      passedChecks++;
    }

    bucket.issues.forEach((i) => {
      if (i.severity === 'erreur') errorCount++;
      else warningCount++;
    });

    return {
      id: bucket.id,
      categorie: bucket.categorie,
      title: bucket.title,
      status,
      issues: bucket.issues,
    };
  });

  const categories: AuditCategoryReport[] = categoryOrder.map((catName) => {
    const catChecks = checkResults.filter((c) => c.categorie === catName);
    const hasError = catChecks.some((c) => c.status === 'erreur');
    const hasWarning = catChecks.some((c) => c.status === 'avertissement');
    const status = hasError ? 'erreur' : hasWarning ? 'avertissement' : 'succes';

    return {
      categorie: catName,
      status,
      checks: catChecks,
    };
  });

  return {
    issues: flatIssues,
    categories,
    totalChecks: allBuckets.length,
    passedChecks,
    errorCount,
    warningCount,
  };
}

/**
 * Run all consistency checks on the database.
 * Returns the list of issues found (empty = database is consistent).
 */
export function auditDatabase(data: AuditData): AuditIssue[] {
  return auditDatabaseReport(data).issues;
}
