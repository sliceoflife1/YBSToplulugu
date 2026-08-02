-- 042_fix_empty_student_no_to_null.sql
-- profiles tablosundaki boş string ('') olan student_no değerlerini NULL yaparak UNIQUE kısıtlaması (profiles_student_no_key) çakışmalarını önler.

UPDATE public.profiles
SET student_no = NULL
WHERE student_no IS NOT NULL AND (student_no = '' OR trim(student_no) = '');

-- handle_new_user tetikleyici fonksiyonunu student_no alanını NULLIF ile işleyecek şekilde güncelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  user_role TEXT;
  meta_role TEXT;
  meta_first_name TEXT;
  meta_last_name TEXT;
  meta_phone TEXT;
  meta_personal_email TEXT;
  meta_department TEXT;
  meta_student_no TEXT;
  meta_class_year SMALLINT;
  is_active_val BOOLEAN := true;
BEGIN
  email_domain := split_part(lower(NEW.email), '@', 2);
  
  -- Meta verileri oku
  meta_role := NEW.raw_user_meta_data ->> 'role';
  meta_first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', '');
  meta_last_name := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');
  meta_phone := NEW.raw_user_meta_data ->> 'phone';
  meta_personal_email := NEW.raw_user_meta_data ->> 'personal_email';
  meta_department := NEW.raw_user_meta_data ->> 'department';
  meta_student_no := NULLIF(trim(NEW.raw_user_meta_data ->> 'student_no'), '');
  
  IF NEW.raw_user_meta_data ->> 'class_year' IS NOT NULL THEN
    meta_class_year := (NEW.raw_user_meta_data ->> 'class_year')::smallint;
  END IF;

  -- Domain'e göre varsayılan rol belirleme
  SELECT role_hint INTO user_role
  FROM public.allowed_email_domains
  WHERE email_domain LIKE '%' || domain
  AND is_active = true
  LIMIT 1;
  
  -- Eğer meta veride geçerli bir rol varsa onu kullan (örneğin employer/faculty)
  IF meta_role IS NOT NULL AND meta_role IN ('student', 'faculty', 'employer', 'admin') THEN
    user_role := meta_role;
  ELSIF user_role IS NULL THEN
    user_role := 'student';
  END IF;

  -- İşverenler admin onayı beklemeli
  IF user_role = 'employer' THEN
    is_active_val := false;
  END IF;
  
  INSERT INTO public.profiles (id, edu_email, first_name, last_name, phone, personal_email, department, student_no, class_year, role, is_active)
  VALUES (
    NEW.id, 
    NEW.email, 
    meta_first_name, 
    meta_last_name, 
    meta_phone,
    meta_personal_email,
    meta_department,
    meta_student_no,
    meta_class_year,
    user_role,
    is_active_val
  )
  ON CONFLICT (edu_email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
