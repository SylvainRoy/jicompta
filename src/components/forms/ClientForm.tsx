/**
 * Client Form Component
 * Used for creating and editing clients
 */

import { useState, useEffect } from 'react';
import type { Client, ClientFormData } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { isValidEmail, isValidSIRET, isValidPhone, isRequired } from '@/utils/validators';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Client) => Promise<void>;
  onCancel: () => void;
}

export default function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    nom: client?.nom || '',
    email: client?.email || '',
    telephone: client?.telephone || '',
    adresse: client?.adresse || '',
    numero_siret: client?.numero_siret || '',
  });

  const [errors, setErrors] = useState<Partial<ClientFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ClientFormData> = {};

    // Nom (required)
    if (!isRequired(formData.nom)) {
      newErrors.nom = 'Le nom est obligatoire';
    }

    // Email (required and valid)
    if (!isRequired(formData.email)) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Telephone (optional but must be valid if provided)
    if (formData.telephone && !isValidPhone(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    // SIRET (optional but must be valid if provided)
    if (formData.numero_siret && !isValidSIRET(formData.numero_siret)) {
      newErrors.numero_siret = 'SIRET invalide (14 chiffres requis)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
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
      const clientData: Client = {
        nom: formData.nom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim() || undefined,
        adresse: formData.adresse.trim() || undefined,
        numero_siret: formData.numero_siret.trim() || undefined,
      };

      await onSubmit(clientData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom"
        type="text"
        value={formData.nom}
        onChange={(e) => handleChange('nom', e.target.value)}
        error={errors.nom}
        required
        placeholder="Nom du client"
        disabled={isSubmitting}
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        required
        placeholder="email@exemple.com"
        disabled={isSubmitting}
      />

      <Input
        label="Téléphone"
        type="tel"
        value={formData.telephone}
        onChange={(e) => handleChange('telephone', e.target.value)}
        error={errors.telephone}
        placeholder="06 12 34 56 78"
        helperText="Optionnel"
        disabled={isSubmitting}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <textarea
          value={formData.adresse}
          onChange={(e) => handleChange('adresse', e.target.value)}
          placeholder="Adresse complète du client (multi-lignes)"
          rows={3}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <p className="mt-1 text-sm text-gray-500">Optionnel</p>
      </div>

      <Input
        label="Numéro SIRET"
        type="text"
        value={formData.numero_siret}
        onChange={(e) => handleChange('numero_siret', e.target.value)}
        error={errors.numero_siret}
        placeholder="12345678901234"
        helperText="Optionnel - 14 chiffres"
        maxLength={14}
        disabled={isSubmitting}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
          {isSubmitting ? 'Enregistrement...' : client ? 'Modifier' : 'Ajouter'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
