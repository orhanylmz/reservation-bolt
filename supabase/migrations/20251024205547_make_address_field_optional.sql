/*
  # Adres Alanını Opsiyonel Yap

  ## Değişiklikler
  - `address` alanını artık zorunlu olmaktan çıkar
  - Yeni adres yapısı (city, district, neighborhood, address_detail) kullanılıyor
  - Eski `address` alanı geriye dönük uyumluluk için tutulacak ama artık zorunlu değil

  ## Güvenlik
  - Mevcut veriler korunuyor
  - Sadece constraint değişikliği yapılıyor
*/

-- Address alanını nullable yap
ALTER TABLE cleaning_requests 
  ALTER COLUMN address DROP NOT NULL;

-- Default değer ekle
ALTER TABLE cleaning_requests 
  ALTER COLUMN address SET DEFAULT '';