'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Feature } from './FeatureList';

interface FeatureListItemProps {
  feature: Feature;
  index: number;
  isRemoveDisabled: boolean;
  onRemove: (id: string) => void;
  onUpdate: (id:string, field: 'name' | 'description', value: string) => void;
  errorName?: string;
  errorDescription?: string;
}

const FeatureListItemComponent: React.FC<FeatureListItemProps> = ({
  feature,
  index,
  isRemoveDisabled,
  onRemove,
  onUpdate,
  errorName,
  errorDescription,
}) => {
  return (
    <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-medium text-gray-600">Feature {index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(feature.id)}
          disabled={isRemoveDisabled}
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
          onChange={(e) => onUpdate(feature.id, 'name', e.target.value)}
          error={errorName}
          required
        />

        <Textarea
          placeholder="Brief description of this feature (optional)"
          value={feature.description}
          onChange={(e) => onUpdate(feature.id, 'description', e.target.value)}
          rows={2}
          maxLength={1000}
          error={errorDescription}
        />
      </div>
    </div>
  )
}

export const FeatureListItem = React.memo(FeatureListItemComponent);
