/**
 * Prestation Form Component
 * Used for creating and editing prestations (services)
 */

import { useState, useEffect } from 'react';
import type { Prestation, PrestationFormData, Client, TypePrestation } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { isRequired } from '@/utils/validators';
import { formatDateForInput } from '@/utils/dateFormatter';

interface PrestationFormProps {
  prestation?: Prestation;
  clients: Client[];
  typesPrestations: TypePrestation[];
  onSubmit: (prestation: Prestation) => Promise<void>;
  onCancel: () => void;
}

export default function PrestationForm({
  prestation,
  clients,
  typesPrestations,
  onSubmit,
  onCancel,
}: PrestationFormProps) {
  const [formData, setFormData] = useState<PrestationFormData>({
    date: prestation?.date
      ? formatDateForInput(prestation.date)
      : '',
    nom_client: prestation?.nom_client || '',
    type_prestation: prestation?.type_prestation || '',
    montant: prestation?.montant.toString() || '',
  });

  const [errors, setErrors] = useState<Partial<PrestationFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill montant when type_prestation changes
  useEffect(() => {
    if (!prestation && formData.type_prestation) {
      const selectedType = typesPrestations.find(
        (type) => type.nom === formData.type_prestation
      );
      if (selectedType) {
        setFormData((prev) => ({
          ...prev,
          montant: selectedType.montant_suggere.toString(),
        }));
      }
    }
  }, [formData.type_prestation, typesPrestations, prestation]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PrestationFormData> = {};

    // Client (required)
    if (!isRequired(formData.nom_client)) {
      newErrors.nom_client = 'Le client est obligatoire';
    }

    // Type de prestation (required)
    if (!isRequired(formData.type_prestation)) {
      newErrors.type_prestation = 'Le type de prestation est obligatoire';
    }

    // Date (required)
    if (!isRequired(formData.date)) {
      newErrors.date = 'La date est obligatoire';
    }

    // Montant (required and must be > 0)
    if (!isRequired(formData.montant)) {
      newErrors.montant = 'Le montant est obligatoire';
    } else if (parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof PrestationFormData, value: string) => {
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
      const prestationData: Prestation = {
        date: formData.date, // Already in YYYY-MM-DD format from input[type="date"]
        nom_client: formData.nom_client.trim(),
        type_prestation: formData.type_prestation.trim(),
        montant: parseFloat(formData.montant),
        paiement_id: prestation?.paiement_id, // Keep existing paiement_id when editing
      };

      await onSubmit(prestationData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client Dropdown */}
      <div>
        <label htmlFor="nom_client" className="block text-sm font-medium text-gray-700 mb-1">
          Client <span className="text-red-500">*</span>
        </label>
        <select
          id="nom_client"
          value={formData.nom_client}
          onChange={(e) => handleChange('nom_client', e.target.value)}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.nom_client ? 'border-red-500' : 'border-gray-300'
          } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        >
          <option value="">Sélectionner un client</option>
          {clients.map((client) => (
            <option key={client.nom} value={client.nom}>
              {client.nom}
            </option>
          ))}
        </select>
        {errors.nom_client && (
          <p className="mt-1 text-sm text-red-600">{errors.nom_client}</p>
        )}
      </div>

      {/* Type de Prestation Dropdown */}
      <div>
        <label htmlFor="type_prestation" className="block text-sm font-medium text-gray-700 mb-1">
          Type de prestation <span className="text-red-500">*</span>
        </label>
        <select
          id="type_prestation"
          value={formData.type_prestation}
          onChange={(e) => handleChange('type_prestation', e.target.value)}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.type_prestation ? 'border-red-500' : 'border-gray-300'
          } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        >
          <option value="">Sélectionner un type</option>
          {typesPrestations.map((type) => (
            <option key={type.nom} value={type.nom}>
              {type.nom}
            </option>
          ))}
        </select>
        {errors.type_prestation && (
          <p className="mt-1 text-sm text-red-600">{errors.type_prestation}</p>
        )}
      </div>

      {/* Date */}
      <Input
        label="Date de la prestation"
        type="date"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors.date}
        required
        disabled={isSubmitting}
      />

      {/* Montant */}
      <Input
        label="Montant (€)"
        type="number"
        step="0.01"
        min="0"
        value={formData.montant}
        onChange={(e) => handleChange('montant', e.target.value)}
        error={errors.montant}
        required
        placeholder="Ex: 50.00"
        helperText="Le montant est pré-rempli avec le montant suggéré du type"
        disabled={isSubmitting}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Enregistrement...' : prestation ? 'Modifier' : 'Ajouter'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
