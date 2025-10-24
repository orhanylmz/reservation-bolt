/*
  # Profil RLS Politikası Sonsuz Döngü Düzeltmesi

  ## Değişiklikler
  - Sonsuz döngüye neden olan politika kaldırıldı
  - Kullanıcıların kendi profillerini veya admin ise tüm profilleri görmesini sağlayan tek bir politika eklendi

  ## Güvenlik
  - Normal kullanıcılar sadece kendi profillerini görebilir
  - Admin kullanıcılar tüm profilleri görebilir
  - Sonsuz döngü önlendi
*/

-- Eski politikaları kaldır
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Yeni birleşik politika - sonsuz döngü olmadan
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    auth.jwt() ->> 'role' = 'admin' OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );