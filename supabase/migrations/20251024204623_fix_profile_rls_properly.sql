/*
  # Profil RLS Politikası Düzeltmesi

  ## Değişiklikler
  - Sonsuz döngüyü önlemek için security definer fonksiyonu eklendi
  - Kullanıcıların rolünü kontrol eden yardımcı fonksiyon oluşturuldu
  - Basitleştirilmiş RLS politikaları

  ## Güvenlik
  - Normal kullanıcılar sadece kendi profillerini görebilir
  - Admin kullanıcılar tüm profilleri görebilir
  - Sonsuz döngü önlendi
*/

-- Eski politikayı kaldır
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

-- Kullanıcının admin olup olmadığını kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Basitleştirilmiş profil görüntüleme politikası
CREATE POLICY "Users can view own profile or admin can view all"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR is_admin()
  );