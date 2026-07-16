import { z } from 'zod/v4';

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyisim en az 2 karakter olmalıdır'),
  bio: z.string().max(500, 'Biyografi en fazla 500 karakter olabilir').optional(),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, 'Geçerli bir telefon numarası giriniz').optional().or(z.literal('')),
  department: z.string().optional(),
  linkedinUrl: z.string().url('Geçerli bir LinkedIn URL giriniz').optional().or(z.literal('')),
  githubUrl: z.string().url('Geçerli bir GitHub URL giriniz').optional().or(z.literal('')),
  personalEmail: z.string().email('Geçerli bir e-posta adresi giriniz').optional(),
  isCvPublic: z.boolean().optional(),
});

export const projectSchema = z.object({
  title: z.string().min(3, 'Proje başlığı en az 3 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  technologies: z.array(z.string()).min(1, 'En az bir teknoloji giriniz'),
  githubUrl: z.string().url('Geçerli bir GitHub URL giriniz').optional().or(z.literal('')),
  youtubeUrl: z.string().url('Geçerli bir YouTube URL giriniz').optional().or(z.literal('')),
  behanceUrl: z.string().url('Geçerli bir Behance URL giriniz').optional().or(z.literal('')),
  externalUrl: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  semester: z.enum(['fall', 'spring', 'summer']).optional(),
  year: z.number().min(2000).max(2030).optional(),
});

export const cvEducationSchema = z.object({
  school: z.string().min(2),
  degree: z.string().min(2),
  field: z.string().min(2),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
});

export const cvExperienceSchema = z.object({
  company: z.string().min(2),
  title: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
});

export const cvDataSchema = z.object({
  education: z.array(cvEducationSchema),
  experience: z.array(cvExperienceSchema),
  skills: z.array(z.string()),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string().optional(),
    url: z.string().url().optional().or(z.literal('')),
  })),
  languages: z.array(z.object({
    language: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'native']),
  })),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CvDataInput = z.infer<typeof cvDataSchema>;
