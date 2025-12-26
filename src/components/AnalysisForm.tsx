'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { FeatureList, Feature } from './FeatureList';
import { createAnalysisSchema } from '@/lib/utils/validation';
import type { CreateAnalysisRequest, ProjectData } from '@/types/api';

type ProjectListItem = { id: string; name?: string; data: ProjectData; updatedAt: string };

export const AnalysisForm: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');

  // Auto-save/project state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Form state
  const [appName, setAppName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<Feature[]>([
    { id: '1', name: '', description: '' },
    { id: '2', name: '', description: '' },
    { id: '3', name: '', description: '' },
  ]);

  // Debounce timer
  const saveTimer = useRef<number | null>(null);

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

  // Save current form state to a Project (auto-save)
  const saveProject = useCallback(async () => {
    setSaveStatus('saving');

    try {
      const nonEmptyFeatures = features.filter((f) => f.name.trim() !== '');
      const data: ProjectData = {
        appName: appName || undefined,
        targetAudience: targetAudience || undefined,
        description: description || undefined,
        features: nonEmptyFeatures.map((f) => ({ name: f.name, description: f.description || undefined })),
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: appName || 'Untitled', data }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSaveStatus('error');
        console.error('Failed to save project', json);
        return;
      }

      const savedProject = json.project;
      setProjectId(savedProject.id);
      setLastSavedAt(Date.now());
      setSaveStatus('saved');

      // Refresh project list
      fetchProjects();
    } catch (err) {
      console.error('Error saving project:', err);
      setSaveStatus('error');
    }
  }, [projectId, appName, targetAudience, description, features]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveProject();
    }, 1000);
  }, [saveProject]);

  useEffect(() => {
    // don't auto-save if everything is empty
    const hasAny = appName || targetAudience || description || features.some((f) => f.name.trim() !== '');
    if (!hasAny) return;
    setSaveStatus('idle');
    scheduleAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName, targetAudience, description, features]);

  // Load user's projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const json = await res.json();
      if (!res.ok) return;
      setProjects(json.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const loadProject = (p: ProjectListItem) => {
    setProjectId(p.id);
    setAppName(p.data.appName || '');
    setTargetAudience(p.data.targetAudience || '');
    setDescription(p.data.description || '');
    if (p.data.features && p.data.features.length) {
      setFeatures(p.data.features.map((f, i) => ({ id: String(i + 1), name: f.name, description: f.description || '' })));
    } else {
      setFeatures([{ id: '1', name: '', description: '' }, { id: '2', name: '', description: '' }, { id: '3', name: '', description: '' }]);
    }
  };

  // Load project from URL query param if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('projectId');
      if (!pid) return;
      (async () => {
        try {
          const res = await fetch(`/api/projects/${pid}`);
          if (!res.ok) return;
          const json = await res.json();
          if (json.project) loadProject(json.project);
        } catch (err) {
          console.error('Error loading project from query param:', err);
        }
      })();
    } catch (err) {
      // ignore (window may not be available in some environments)
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      // Ensure project is saved before starting analysis
      await saveProject();

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

      {/* Projects picker + save status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Saved Projects</label>
          <select
            value={projectId || ''}
            onChange={(e) => {
              const id = e.target.value;
              const selected = projects.find((p) => p.id === id);
              if (selected) loadProject(selected);
            }}
            className="border rounded p-2"
          >
            <option value="">-- Select project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || 'Untitled'} — {new Date(p.updatedAt).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {saveStatus === 'saving' && <span>Saving…</span>}
          {saveStatus === 'saved' && lastSavedAt && (
            <span>Saved {Math.round((Date.now() - lastSavedAt) / 1000)}s ago</span>
          )}
          {saveStatus === 'error' && <span className="text-red-600">Error saving</span>}
        </div>
      </div>

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
        <FeatureList features={features} onChange={(f) => { setFeatures(f); }} errors={errors} />
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
