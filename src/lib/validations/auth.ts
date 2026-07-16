import { z } from 'zod/v4';

export const studentRegisterSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .refine(
      (email) => email.endsWith('@ogr.deu.edu.tr'),
      'Sadece @ogr.deu.edu.tr uzantılı e-posta adresleri kabul edilmektedir'
    ),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyisim en az 2 karakter olmalıdır'),
  studentNo: z
    .string()
    .regex(/^\d{9,11}$/, 'Geçerli bir öğrenci numarası giriniz'),
  personalEmail: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, 'Geçerli bir telefon numarası giriniz').optional(),
  department: z.string().min(1, 'Bölüm seçiniz'),
  classYear: z.number().min(1).max(6).optional(),
  kvkkConsent: z.literal(true, { message: 'KVKK onayı zorunludur' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export const facultyRegisterSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .refine(
      (email) => email.endsWith('@deu.edu.tr'),
      'Sadece @deu.edu.tr uzantılı e-posta adresleri kabul edilmektedir'
    ),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyisim en az 2 karakter olmalıdır'),
  department: z.string().min(1, 'Bölüm seçiniz'),
  title: z.string().min(1, 'Unvan seçiniz'),
  kvkkConsent: z.literal(true, { message: 'KVKK onayı zorunludur' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export const organizationRegisterSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır'),
  confirmPassword: z.string(),
  orgName: z.string().min(2, 'Kuruluş adı en az 2 karakter olmalıdır'),
  orgType: z.enum(['employer', 'foundation', 'association', 'other'], {
    message: 'Kuruluş türü seçiniz',
  }),
  contactName: z.string().min(2, 'İletişim kişisi adı zorunludur'),
  contactPhone: z.string().regex(/^\+?[0-9]{10,13}$/, 'Geçerli bir telefon numarası giriniz'),
  website: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  kvkkConsent: z.literal(true, { message: 'KVKK onayı zorunludur' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(1, 'Şifre zorunludur'),
});

export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type FacultyRegisterInput = z.infer<typeof facultyRegisterSchema>;
export type OrganizationRegisterInput = z.infer<typeof organizationRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
