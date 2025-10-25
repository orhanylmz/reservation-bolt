/*
  # Profiles Tablosuna Eksik Alanları Ekle

  1. Yeni Alanlar
    - `city` - Kullanıcının şehri
    - `district` - Kullanıcının ilçesi
    - `is_approved` - Kullanıcının onaylanma durumu (özellikle çalışanlar için)

  2. Güvenlik
    - Mevcut RLS politikaları korunuyor
*/

-- Eksik alanları ekle
DO $$ 
BEGIN
  -- city alanı yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  -- district alanı yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'district'
  ) THEN
    ALTER TABLE profiles ADD COLUMN district text;
  END IF;

  -- is_approved alanı yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_approved boolean DEFAULT false;
  END IF;

  -- phone alanını NOT NULL yap (eğer NULL ise)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone' AND is_nullable = 'YES'
  ) THEN
    -- Önce boş değerleri doldur
    UPDATE profiles SET phone = '' WHERE phone IS NULL;
    -- Sonra NOT NULL yap
    ALTER TABLE profiles ALTER COLUMN phone SET NOT NULL;
  END IF;
END $$;