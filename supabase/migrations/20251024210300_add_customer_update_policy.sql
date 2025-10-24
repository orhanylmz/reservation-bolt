/*
  # Müşteri Güncelleme Politikası

  ## Değişiklikler
  - Müşterilerin kendi taleplerini güncellemesine izin ver
  - Bu özellikle onay/red işlemleri için gerekli
  - Müşteriler sadece kendi taleplerini güncelleyebilir

  ## Güvenlik
  - Müşteri sadece kendi taleplerine (customer_id = auth.uid()) erişebilir
  - Müşteri rolü kontrolü yapılıyor
*/

-- Müşterilerin kendi taleplerini güncellemesine izin ver
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cleaning_requests' 
    AND policyname = 'Customers can update own requests'
  ) THEN
    CREATE POLICY "Customers can update own requests"
      ON cleaning_requests
      FOR UPDATE
      TO authenticated
      USING (
        customer_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'customer'
        )
      )
      WITH CHECK (
        customer_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'customer'
        )
      );
  END IF;
END $$;