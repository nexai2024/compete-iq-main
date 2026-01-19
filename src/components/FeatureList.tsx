'use client';

import React, { useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { FeatureListItem } from './FeatureListItem';

export interface Feature {
  id: string;
  name: string;
  description: string;
}

export interface FeatureListProps {
  features: Feature[];
  onChange: (features: Feature[]) => void;
  errors?: Record<string, string>;
}

export const FeatureList: React.FC<FeatureListProps> = ({ features, onChange, errors = {} }) => {
  const addFeature = () => {
    if (features.length >= 50) return;

    const newFeature: Feature = {
      id: `feature-${Date.now()}-${Math.random()}`,
      name: '',
      description: '',
    };
    onChange([...features, newFeature]);
  };

  const removeFeature = useCallback((id: string) => {
    if (features.length <= 1) return;
    onChange(features.filter((f) => f.id !== id));
  }, [features, onChange]);

  const updateFeature = useCallback((id: string, field: 'name' | 'description', value: string) => {
    onChange(
      features.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }, [features, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Feature List <span className="text-red-500">*</span>
        </label>
        <span className="text-sm text-gray-500">
          {features.length} / 50 features
        </span>
      </div>

      <div className="space-y-6">
        {features.map((feature, index) => (
          <FeatureListItem
            key={feature.id}
            feature={feature}
            index={index}
            isRemoveDisabled={features.length <= 1}
            onRemove={removeFeature}
            onUpdate={updateFeature}
            errorName={errors[`features.${index}.name`]}
            errorDescription={errors[`features.${index}.description`]}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addFeature}
        disabled={features.length >= 50}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Feature
      </Button>

      {features.length >= 50 && (
        <p className="text-sm text-orange-600">Maximum 50 features reached</p>
      )}
      {errors.features && (
        <p className="text-sm text-red-600">{errors.features}</p>
      )}
    </div>
  );
};
