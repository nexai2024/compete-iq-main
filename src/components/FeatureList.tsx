'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';

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

  const removeFeature = (id: string) => {
    if (features.length <= 1) return;
    onChange(features.filter((f) => f.id !== id));
  };

  const updateFeature = (id: string, field: 'name' | 'description', value: string) => {
    onChange(
      features.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

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
          <div key={feature.id} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-gray-600">Feature {index + 1}</span>
              <button
                type="button"
                onClick={() => removeFeature(feature.id)}
                disabled={features.length <= 1}
                className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Remove feature"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="e.g., Real-time collaboration"
                value={feature.name}
                onChange={(e) => updateFeature(feature.id, 'name', e.target.value)}
                error={errors[`features.${index}.name`]}
                required
              />

              <Textarea
                placeholder="Brief description of this feature (optional)"
                value={feature.description}
                onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                rows={2}
                maxLength={1000}
                error={errors[`features.${index}.description`]}
              />
            </div>
          </div>
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
