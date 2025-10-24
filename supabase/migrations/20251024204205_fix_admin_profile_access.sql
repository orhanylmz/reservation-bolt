/*
  # Admin Profil Erişimi Düzeltmesi

  ## Değişiklikler
  - Adminlerin tüm profilleri görüntüleyebilmesi için yeni bir SELECT politikası eklendi
  - Mevcut politikalar korundu

  ## Güvenlik
  - Admin rolündeki kullanıcılar tüm profilleri görebilir
  - Diğer kullanıcılar sadece kendi profillerini görebilir
*/

-- Admin kullanıcıların tüm profilleri görmesini sağla
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );