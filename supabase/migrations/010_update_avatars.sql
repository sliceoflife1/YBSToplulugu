-- =====================================================
-- YBS TOPLULUGU - TEST KULLANICILARI AVATAR GÜNCELLEME SQL
-- Test kullanıcılarının profil resimlerinin (avatar_url)
-- veritabanında kesin olarak güncellenmesini sağlar.
-- =====================================================

UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Akademisyenler
UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '66666666-6666-6666-6666-666666666666';

UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '77777777-7777-7777-7777-777777777777';

UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '88888888-8888-8888-8888-888888888888';

-- Mezunlar Derneği
UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = '99999999-9999-9999-9999-999999999999';

-- İşveren
UPDATE public.profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
