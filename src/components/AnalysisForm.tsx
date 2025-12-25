'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { FeatureList, Feature } from './FeatureList';
import { createAnalysisSchema } from '@/lib/utils/validation';
import type { CreateAnalysisRequest } from '@/types/api';

export const AnalysisForm: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');

  // Form state
  const [appName, setAppName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<Feature[]>([
    { id: '1', name: '', description: '' },
    { id: '2', name: '', description: '' },
    { id: '3', name: '', description: '' },
  ]);

  const validateForm = (): boolean => {
    setErrors({});
    setServerError('');

    // Filter out empty features
    const nonEmptyFeatures = features.filter((f) => f.name.trim() !== '');

    const data = {
      appName,
      targetAudience,
      description,
      features: nonEmptyFeatures.map((f) => ({
        name: f.name,
        description: f.description || undefined,
      })),
    };

    const result = createAnalysisSchema.safeParse(data);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);

      // Scroll to first error
      const firstErrorElement = document.querySelector('[class*="text-red-"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      // Filter out empty features
      const nonEmptyFeatures = features.filter((f) => f.name.trim() !== '');

      const requestData: CreateAnalysisRequest = {
        appName,
        targetAudience,
        description,
        features: nonEmptyFeatures.map((f) => ({
          name: f.name,
          description: f.description || undefined,
        })),
      };

      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.validationErrors) {
          setErrors(data.validationErrors);
        } else {
          setServerError(data.error || 'Failed to create analysis');
        }
        return;
      }

      // Redirect to analysis page
      router.push(`/analysis/${data.analysisId}`);
    } catch (error) {
      console.error('Error creating analysis:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{serverError}</p>
        </div>
      )}

      {/* Section 1: App Name */}
      <div>
        <Input
          label="App Name"
          placeholder="e.g., TaskMaster Pro"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          error={errors.appName}
          required
          maxLength={255}
        />
      </div>

      {/* Section 2: Target Audience */}
      <div>
        <Input
          label="Target Audience"
          placeholder="e.g., Small business owners managing remote teams"
          helperText="Who is this app for? Be specific."
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          error={errors.targetAudience}
          required
        />
      </div>

      {/* Section 3: Description */}
      <div>
        <Textarea
          label="App Description"
          placeholder="Describe your app idea in detail. What problem does it solve? How does it work?"
          helperText="The more detail, the better the analysis. Minimum 50 characters."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          required
          rows={6}
          maxLength={5000}
          showCharCount
        />
      </div>

      {/* Section 4: Feature List */}
      <div>
        <FeatureList features={features} onChange={setFeatures} errors={errors} />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Analysis...' : 'Analyze My App'}
        </Button>
      </div>
    </form>
  );
};
