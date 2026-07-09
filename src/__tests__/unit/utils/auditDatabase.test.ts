/**
 * Tests for the database audit
 */

import { describe, it, expect } from 'vitest';
import { auditDatabase, type AuditData } from '@/utils/auditDatabase';
import type { Prestation, Paiement, Depense } from '@/types';

function baseData(): AuditData {
  const prestation: Prestation = {
    date: '2026-01-10',
    nom_client: 'Alice',
    type_prestation: 'Cours',
    montant: 50,
    paiement_id: '2601100001',
  };
  const paiement: Paiement = {
    reference: '2601100001',
    client: 'Alice',
    total: 50,
    date_encaissement: '2026-01-15',
    mode_encaissement: 'virement',
  };
  return {
    clients: [{ nom: 'Alice', email: 'alice@example.com' }],
    typesPrestations: [{ nom: 'Cours', montant_suggere: 50 }],
    prestations: [prestation],
    paiements: [paiement],
    depenses: [],
  };
}

function messages(data: AuditData): string[] {
  return auditDatabase(data).map((i) => i.message);
}

describe('auditDatabase', () => {
  it('returns no issue for a consistent database', () => {
    expect(auditDatabase(baseData())).toEqual([]);
  });

  describe('références croisées', () => {
    it('detects a prestation referencing an unknown client', () => {
      const data = baseData();
      data.prestations[0].nom_client = 'Inconnu';
      expect(messages(data).join('\n')).toContain('le client "Inconnu" n\'existe pas');
    });

    it('detects a prestation referencing an unknown type', () => {
      const data = baseData();
      data.prestations[0].type_prestation = 'Massage';
      expect(messages(data).join('\n')).toContain('le type de prestation "Massage" n\'existe pas');
    });

    it('detects a prestation referencing an unknown payment', () => {
      const data = baseData();
      data.prestations[0].paiement_id = '9901010001';
      const msgs = messages(data).join('\n');
      expect(msgs).toContain('le paiement "9901010001" n\'existe pas');
      // The real payment is now orphaned too
      expect(msgs).toContain('aucune prestation ne lui est liée');
    });

    it('detects a payment referencing an unknown client', () => {
      const data = baseData();
      data.paiements[0].client = 'Inconnu';
      data.prestations[0].nom_client = 'Inconnu';
      expect(messages(data).join('\n')).toContain('Paiement 2601100001: le client "Inconnu" n\'existe pas');
    });

    it('detects an expense on an unknown account', () => {
      const data = baseData();
      const depense: Depense = { date: '2026-02-01', compte: 'Inconnu', montant: 10, description: 'Achat' };
      data.depenses.push(depense);
      expect(messages(data).join('\n')).toContain('le compte "Inconnu" n\'existe pas');
    });

    it('accepts an expense on "Mon compte"', () => {
      const data = baseData();
      data.depenses.push({ date: '2026-02-01', compte: 'Mon compte', montant: 10, description: 'Achat' });
      expect(auditDatabase(data)).toEqual([]);
    });

    it('detects a payment with no linked prestation', () => {
      const data = baseData();
      data.paiements.push({ reference: '2602010001', client: 'Alice', total: 30 });
      expect(messages(data).join('\n')).toContain('Paiement 2602010001');
      expect(messages(data).join('\n')).toContain('aucune prestation ne lui est liée');
    });
  });

  describe('doublons', () => {
    it('detects duplicate clients', () => {
      const data = baseData();
      data.clients.push({ nom: 'Alice', email: 'alice2@example.com' });
      expect(messages(data).join('\n')).toContain('Client "Alice" présent 2 fois');
    });

    it('detects duplicate types de prestation', () => {
      const data = baseData();
      data.typesPrestations.push({ nom: 'Cours', montant_suggere: 60 });
      expect(messages(data).join('\n')).toContain('Type de prestation "Cours" présent 2 fois');
    });

    it('detects duplicate payment references', () => {
      const data = baseData();
      data.paiements.push({ ...data.paiements[0] });
      expect(messages(data).join('\n')).toContain('Référence de paiement "2601100001" présente 2 fois');
    });

    it('detects the same prestation given twice on the same day', () => {
      const data = baseData();
      data.prestations.push({ ...data.prestations[0], paiement_id: undefined });
      const issues = auditDatabase(data);
      const dup = issues.find((i) => i.message.includes('présente 2 fois le 10/01/2026'));
      expect(dup).toBeDefined();
      expect(dup!.severity).toBe('erreur');
    });

    it('allows the same prestation type on different days', () => {
      const data = baseData();
      data.prestations.push({ ...data.prestations[0], date: '2026-01-11', paiement_id: undefined });
      // Only the payment total mismatch should NOT appear (second prestation is unlinked)
      expect(auditDatabase(data)).toEqual([]);
    });

    it('flags duplicate expenses as a warning', () => {
      const data = baseData();
      const depense: Depense = { date: '2026-02-01', compte: 'Mon compte', montant: 10, description: 'Achat' };
      data.depenses.push(depense, { ...depense });
      const issues = auditDatabase(data);
      const dup = issues.find((i) => i.message.includes('Dépense "Achat"'));
      expect(dup).toBeDefined();
      expect(dup!.severity).toBe('avertissement');
    });
  });

  describe('cohérence des paiements', () => {
    it('detects a payment total not matching the sum of linked prestations', () => {
      const data = baseData();
      data.paiements[0].total = 60;
      expect(messages(data).join('\n')).toContain('total 60,00 € différent de la somme des prestations liées 50,00 €');
    });

    it('tolerates floating point rounding in totals', () => {
      const data = baseData();
      data.prestations[0].montant = 0.1;
      data.prestations.push({ ...data.prestations[0], date: '2026-01-11', montant: 0.2 });
      data.paiements[0].total = 0.3;
      expect(auditDatabase(data)).toEqual([]);
    });

    it('detects a linked prestation belonging to another client', () => {
      const data = baseData();
      data.clients.push({ nom: 'Bob', email: 'bob@example.com' });
      data.prestations[0].nom_client = 'Bob';
      expect(messages(data).join('\n')).toContain('appartient à un autre client');
    });

    it('detects an associative prestation linked to a payment', () => {
      const data = baseData();
      data.prestations[0].associatif = true;
      expect(messages(data).join('\n')).toContain('ne peut pas être liée à un paiement');
    });

    it('warns when an encaissed payment has no mode', () => {
      const data = baseData();
      data.paiements[0].mode_encaissement = undefined;
      const issues = auditDatabase(data);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('avertissement');
      expect(issues[0].message).toContain('sans mode d\'encaissement');
    });
  });

  describe('formats et champs obligatoires', () => {
    it('detects an invalid prestation date', () => {
      const data = baseData();
      data.prestations[0].date = '10/01/2026';
      expect(messages(data).join('\n')).toContain('date invalide "10/01/2026"');
    });

    it('warns about a prestation date in the future', () => {
      const data = baseData();
      data.prestations[0].date = '2099-01-10';
      const issues = auditDatabase(data);
      const future = issues.find((i) => i.message.includes('date dans le futur'));
      expect(future).toBeDefined();
      expect(future!.severity).toBe('avertissement');
    });

    it('detects a non-positive prestation amount', () => {
      const data = baseData();
      data.prestations[0].montant = 0;
      const msgs = messages(data).join('\n');
      expect(msgs).toContain('montant invalide (0)');
    });

    it('detects a missing client name', () => {
      const data = baseData();
      data.clients.push({ nom: '   ', email: '' });
      expect(messages(data).join('\n')).toContain('nom manquant');
    });

    it('warns about an invalid client email', () => {
      const data = baseData();
      data.clients[0].email = 'pas-un-email';
      const issues = auditDatabase(data);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('avertissement');
      expect(issues[0].message).toContain('email invalide');
    });

    it('detects an invalid expense amount', () => {
      const data = baseData();
      data.depenses.push({ date: '2026-02-01', compte: 'Mon compte', montant: -5, description: 'Achat' });
      expect(messages(data).join('\n')).toContain('Dépense "Achat": montant invalide (-5)');
    });
  });

  describe('comptes', () => {
    it('warns when an associative account has a negative balance', () => {
      const data = baseData();
      data.prestations.push({
        date: '2026-03-01',
        nom_client: 'Alice',
        type_prestation: 'Cours',
        montant: 20,
        associatif: true,
      });
      data.depenses.push({ date: '2026-03-02', compte: 'Alice', montant: 30, description: 'Achat matériel' });
      const issues = auditDatabase(data);
      const negative = issues.find((i) => i.message.includes('solde négatif'));
      expect(negative).toBeDefined();
      expect(negative!.severity).toBe('avertissement');
      expect(negative!.message).toContain('Compte "Alice"');
    });

    it('does not warn when the associative account balance is positive', () => {
      const data = baseData();
      data.prestations.push({
        date: '2026-03-01',
        nom_client: 'Alice',
        type_prestation: 'Cours',
        montant: 50,
        associatif: true,
      });
      data.depenses.push({ date: '2026-03-02', compte: 'Alice', montant: 30, description: 'Achat matériel' });
      expect(auditDatabase(data)).toEqual([]);
    });
  });
});
