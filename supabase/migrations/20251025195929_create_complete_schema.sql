/*
  # TemizPro - Tam Veritabanı Şeması

  1. Tablolar
    - `profiles` - Kullanıcı profilleri (admin, employee, customer)
      - id, email, full_name, phone, role, city, district, is_approved, created_at
    - `cleaning_requests` - Temizlik talepleri
      - id, customer_id, city, district, neighborhood, address_detail, service_date, service_time
      - home_size, special_notes, status, employee_count, price, completed_at, confirmed_at, created_at
    - `request_assignments` - Talep-Çalışan atamaları (many-to-many)
      - id, request_id, employee_id, assigned_at, completed_by_employee, completed_at

  2. Güvenlik
    - Tüm tablolarda RLS etkin
    - Admin kontrolü için is_admin() fonksiyonu
    - Kullanıcılar sadece kendi verilerini görebilir
    - Adminler tüm verilere erişebilir
    - Çalışanlar atandıkları talepleri görebilir

  3. İndeksler
    - Performans için gerekli tüm indeksler eklendi
*/

-- PROFILES TABLOSU
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'employee', 'admin')),
  city text,
  district text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- CLEANING REQUESTS TABLOSU
CREATE TABLE cleaning_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city text NOT NULL,
  district text NOT NULL,
  neighborhood text NOT NULL,
  address_detail text NOT NULL,
  service_date date NOT NULL,
  service_time text NOT NULL,
  home_size text NOT NULL CHECK (home_size IN ('small', 'medium', 'large')),
  special_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled')),
  employee_count integer NOT NULL DEFAULT 1,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  completed_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- REQUEST ASSIGNMENTS TABLOSU (Many-to-Many)
CREATE TABLE request_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES cleaning_requests(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  completed_by_employee boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(request_id, employee_id)
);

-- İNDEKSLER
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_cleaning_requests_customer ON cleaning_requests(customer_id);
CREATE INDEX idx_cleaning_requests_status ON cleaning_requests(status);
CREATE INDEX idx_cleaning_requests_date ON cleaning_requests(service_date);
CREATE INDEX idx_request_assignments_request ON request_assignments(request_id);
CREATE INDEX idx_request_assignments_employee ON request_assignments(employee_id);

-- RLS ETKİNLEŞTİR
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_assignments ENABLE ROW LEVEL SECURITY;

-- ADMIN KONTROL FONKSİYONU
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

-- ==========================================
-- PROFILES RLS POLİTİKALARI
-- ==========================================

-- SELECT: Kullanıcılar kendi profillerini, adminler tümünü görebilir
CREATE POLICY "Users can view own profile or admins view all"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- INSERT: Yeni kullanıcı kaydı
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Adminler tüm profilleri güncelleyebilir (onaylama için)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==========================================
-- CLEANING REQUESTS RLS POLİTİKALARI
-- ==========================================

-- SELECT: Müşteri kendi taleplerini, çalışan atandıklarını, admin tümünü görebilir
CREATE POLICY "Users can view relevant requests"
  ON cleaning_requests FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    is_admin() OR
    EXISTS (
      SELECT 1 FROM request_assignments
      WHERE request_assignments.request_id = cleaning_requests.id
      AND request_assignments.employee_id = auth.uid()
    )
  );

-- INSERT: Sadece müşteriler talep oluşturabilir
CREATE POLICY "Customers can create requests"
  ON cleaning_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'customer'
    )
  );

-- UPDATE: Müşteriler kendi taleplerini güncelleyebilir
CREATE POLICY "Customers can update own requests"
  ON cleaning_requests FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- UPDATE: Adminler tüm talepleri güncelleyebilir
CREATE POLICY "Admins can update all requests"
  ON cleaning_requests FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- UPDATE: Çalışanlar atandıkları talepleri güncelleyebilir
CREATE POLICY "Employees can update assigned requests"
  ON cleaning_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM request_assignments
      WHERE request_assignments.request_id = cleaning_requests.id
      AND request_assignments.employee_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM request_assignments
      WHERE request_assignments.request_id = cleaning_requests.id
      AND request_assignments.employee_id = auth.uid()
    )
  );

-- DELETE: Sadece adminler talep silebilir
CREATE POLICY "Only admins can delete requests"
  ON cleaning_requests FOR DELETE
  TO authenticated
  USING (is_admin());

-- ==========================================
-- REQUEST ASSIGNMENTS RLS POLİTİKALARI
-- ==========================================

-- SELECT: Çalışan kendi atamalarını, müşteri taleplerine yapılan atamaları, admin tümünü görebilir
CREATE POLICY "Users can view relevant assignments"
  ON request_assignments FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() OR
    is_admin() OR
    EXISTS (
      SELECT 1 FROM cleaning_requests
      WHERE cleaning_requests.id = request_assignments.request_id
      AND cleaning_requests.customer_id = auth.uid()
    )
  );

-- INSERT: Sadece adminler atama yapabilir
CREATE POLICY "Only admins can create assignments"
  ON request_assignments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: Çalışanlar kendi atamalarını güncelleyebilir (tamamlama için)
CREATE POLICY "Employees can update own assignments"
  ON request_assignments FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- UPDATE: Adminler tüm atamaları güncelleyebilir
CREATE POLICY "Admins can update all assignments"
  ON request_assignments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Sadece adminler atama silebilir
CREATE POLICY "Only admins can delete assignments"
  ON request_assignments FOR DELETE
  TO authenticated
  USING (is_admin());