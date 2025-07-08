import { z } from 'zod';

// Link validation schema
export const linkSchema = z.object({
  original_url: z.string()
    .url('Por favor, insira uma URL válida')
    .min(1, 'URL é obrigatória'),
  title: z.string().optional(),
  custom_slug: z.string()
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug deve conter apenas letras, números, hífens e underscores')
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .optional(),
  expires_at: z.string().optional(),
  max_clicks: z.number().positive('Número máximo de cliques deve ser positivo').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  tags: z.array(z.string()).optional(),
  // UTM parameters
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  // A/B testing
  ab_test_urls: z.array(z.string().url('URLs de teste devem ser válidas')).optional(),
  ab_test_weights: z.array(z.number().min(0).max(100)).optional(),
  // Deep linking
  deep_link_ios: z.string().url('URL do deep link iOS deve ser válida').optional(),
  deep_link_android: z.string().url('URL do deep link Android deve ser válida').optional(),
});

// Auth validation schemas
export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  avatar_url: z.string().url('URL do avatar deve ser válida').optional(),
  custom_domain: z.string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Domínio inválido')
    .optional(),
});

// Workspace validation schema
export const workspaceSchema = z.object({
  name: z.string().min(1, 'Nome do workspace é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  slug: z.string()
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug deve conter apenas letras, números, hífens e underscores')
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres'),
});

export type LinkFormData = z.infer<typeof linkSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type WorkspaceFormData = z.infer<typeof workspaceSchema>;