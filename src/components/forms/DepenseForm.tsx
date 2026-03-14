/**
 * Depense Form Component
 * Used for creating and editing depenses
 */

import { useState, useMemo } from 'react';
import type { Depense, DepenseFormData } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { isRequired, isValidAmount } from '@/utils/validators';
import { useData } from '@/contexts/DataContext';
import { MON_COMPTE } from '@/constants';

interface DepenseFormProps {
  depense?: Depense;
  onSubmit: (depense: Depense) => Promise<void>;
  onCancel: () => void;
}

export default function DepenseForm({ depense, onSubmit, onCancel }: DepenseFormProps) {
  const { clients, prestations } = useData();

  const [formData, setFormData] = useState<DepenseFormData>({
    date: depense?.date || new Date().toISOString().split('T')[0],
    compte: depense?.compte || MON_COMPTE,
    montant: depense ? String(depense.montant) : '',
    description: depense?.description || '',
  });

  const [errors, setErrors] = useState<Partial<DepenseFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available comptes: "Mon compte" + clients with associative prestations or existing depenses
  const availableComptes = useMemo(() => {
    const comptesSet = new Set<string>();

    // Always include "Mon compte"
    comptesSet.add(MON_COMPTE);

    // Include clients with associative prestations
    prestations.forEach((prestation) => {
      if (prestation.associatif) {
        comptesSet.add(prestation.nom_client);
      }
    });

    // Include all client names for flexibility
    clients.forEach((client) => {
      comptesSet.add(client.nom);
    });

    return Array.from(comptesSet).sort((a, b) => {
      // "Mon compte" always first
      if (a === MON_COMPTE) return -1;
      if (b === MON_COMPTE) return 1;
      return a.localeCompare(b);
    });
  }, [clients, prestations]);

  const validateForm = (): boolean => {
    const newErrors: Partial<DepenseFormData> = {};

    // Date (required)
    if (!isRequired(formData.date)) {
      newErrors.date = 'La date est obligatoire';
    }

    // Compte (required)
    if (!isRequired(formData.compte)) {
      newErrors.compte = 'Le compte est obligatoire';
    }

    // Montant (required and valid)
    if (!isRequired(formData.montant)) {
      newErrors.montant = 'Le montant est obligatoire';
    } else if (!isValidAmount(formData.montant)) {
      newErrors.montant = 'Montant invalide (nombre positif requis)';
    }

    // Description (required)
    if (!isRequired(formData.description)) {
      newErrors.description = 'La description est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof DepenseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const depenseData: Depense = {
        date: formData.date,
        compte: formData.compte,
        montant: parseFloat(formData.montant),
        description: formData.description.trim(),
      };

      await onSubmit(depenseData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors.date}
        required
        disabled={isSubmitting}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Compte <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.compte}
          onChange={(e) => handleChange('compte', e.target.value)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">Sélectionner un compte</option>
          {availableComptes.map((compte) => (
            <option key={compte} value={compte}>
              {compte}
            </option>
          ))}
        </select>
        {errors.compte && (
          <p className="mt-1 text-sm text-red-600">{errors.compte}</p>
        )}
      </div>

      <Input
        label="Montant"
        type="number"
        step="0.01"
        min="0"
        value={formData.montant}
        onChange={(e) => handleChange('montant', e.target.value)}
        error={errors.montant}
        required
        placeholder="0.00"
        disabled={isSubmitting}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Description de la dépense"
          rows={3}
          required
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Enregistrement...' : depense ? 'Modifier' : 'Ajouter'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
