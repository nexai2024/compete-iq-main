import { z } from 'zod';

// Feature input validation
export const featureSchema = z.object({
  name: z.string().min(2, 'Feature name must be at least 2 characters').max(255, 'Feature name must be less than 255 characters'),
  description: z.string().max(1000, 'Feature description must be less than 1000 characters').optional(),
});

// Analysis creation validation
export const createAnalysisSchema = z.object({
  appName: z.string().min(2, 'App name must be at least 2 characters').max(255, 'App name must be less than 255 characters'),
  targetAudience: z.string().min(10, 'Target audience must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description must be less than 5000 characters'),
  features: z.array(featureSchema).min(1, 'At least one feature is required').max(50, 'Maximum 50 features allowed'),
});

// Persona message validation
export const sendPersonaMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message must be less than 1000 characters'),
});

// Types inferred from schemas
export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
export type FeatureInput = z.infer<typeof featureSchema>;
export type SendPersonaMessageInput = z.infer<typeof sendPersonaMessageSchema>;
