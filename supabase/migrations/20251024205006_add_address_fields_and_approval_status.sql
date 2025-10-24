/*
  # Adres Alanları ve Müşteri Onay Sistemi

  ## Değişiklikler
  1. Yeni Alanlar
    - `city` (il): Türkiye'deki il bilgisi
    - `district` (ilçe): İlçe bilgisi
    - `neighborhood` (mahalle): Mahalle bilgisi
    - `address_detail`: Detaylı adres (sokak, bina, daire vb.)
    - `completed_at`: Çalışanın tamamladığı zaman
    - `confirmed_at`: Müşterinin onayladığı zaman

  2. Durum Güncellemeleri
    - 'pending': Beklemede
    - 'assigned': Çalışana atandı
    - 'in_progress': İş yapılıyor
    - 'awaiting_confirmation': Çalışan tamamladı, müşteri onayı bekleniyor
    - 'completed': Müşteri onayladı, tamamlandı
    - 'cancelled': İptal edildi

  ## Güvenlik
  - Mevcut veriler korundu
  - RLS politikaları devam ediyor
*/

-- Yeni alanları ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaning_requests' AND column_name = 'city'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN city text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaning_requests' AND column_name = 'district'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN district text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaning_requests' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN neighborhood text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaning_requests' AND column_name = 'address_detail'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN address_detail text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaning_requests' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaning_requests' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN confirmed_at timestamptz;
  END IF;
END $$;

-- Status enum'ını güncelle - önce constraint'i kaldırıp yeniden ekleyelim
DO $$ 
BEGIN
  -- Mevcut constraint'i bul ve kaldır
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'cleaning_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE cleaning_requests DROP CONSTRAINT IF EXISTS cleaning_requests_status_check;
  END IF;
  
  -- Yeni constraint ekle
  ALTER TABLE cleaning_requests 
    ADD CONSTRAINT cleaning_requests_status_check 
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'));
END $$;