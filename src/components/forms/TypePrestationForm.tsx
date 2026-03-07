/**
 * Type Prestation Form Component
 * Used for creating and editing service types
 */

import { useState } from 'react';
import type { TypePrestation, TypePrestationFormData } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { isRequired, isValidAmount } from '@/utils/validators';

interface TypePrestationFormProps {
  typePrestation?: TypePrestation;
  onSubmit: (type: TypePrestation) => Promise<void>;
  onCancel: () => void;
}

export default function TypePrestationForm({
  typePrestation,
  onSubmit,
  onCancel,
}: TypePrestationFormProps) {
  const [formData, setFormData] = useState<TypePrestationFormData>({
    nom: typePrestation?.nom || '',
    montant_suggere: typePrestation?.montant_suggere.toString() || '',
  });

  const [errors, setErrors] = useState<Partial<TypePrestationFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<TypePrestationFormData> = {};

    // Nom (required)
    if (!isRequired(formData.nom)) {
      newErrors.nom = 'Le nom est obligatoire';
    }

    // Montant suggéré (required and must be > 0)
    if (!isRequired(formData.montant_suggere)) {
      newErrors.montant_suggere = 'Le montant suggéré est obligatoire';
    } else if (!isValidAmount(formData.montant_suggere)) {
      newErrors.montant_suggere = 'Le montant doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof TypePrestationFormData, value: string) => {
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
      const typeData: TypePrestation = {
        nom: formData.nom.trim(),
        montant_suggere: parseFloat(formData.montant_suggere),
      };

      await onSubmit(typeData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom du type de prestation"
        type="text"
        value={formData.nom}
        onChange={(e) => handleChange('nom', e.target.value)}
        error={errors.nom}
        required
        placeholder="Ex: Cours individuel à l'unité"
        disabled={isSubmitting}
      />

      <Input
        label="Montant suggéré (€)"
        type="number"
        step="0.01"
        min="0"
        value={formData.montant_suggere}
        onChange={(e) => handleChange('montant_suggere', e.target.value)}
        error={errors.montant_suggere}
        required
        placeholder="Ex: 50.00"
        helperText="Ce montant sera suggéré lors de la création d'une prestation"
        disabled={isSubmitting}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Enregistrement...' : typePrestation ? 'Modifier' : 'Ajouter'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
