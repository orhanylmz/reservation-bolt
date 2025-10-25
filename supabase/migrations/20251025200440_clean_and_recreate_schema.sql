/*
  # Temizlik ve Yeniden Oluşturma

  1. Silinen Öğeler
    - Mevcut tüm tablolar ve fonksiyonlar

  2. Yeni Tablolar
    - profiles: Kullanıcı profilleri
    - cleaning_requests: Temizlik talepleri
    - request_assignments: Talep atamaları

  3. Güvenlik
    - Tüm tablolarda RLS aktif
    - Admin kontrolü için is_admin() fonksiyonu
    - Kapsamlı politikalar
*/

-- Önce mevcut yapıyı temizle
DROP TABLE IF EXISTS request_assignments CASCADE;
DROP TABLE IF EXISTS cleaning_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- PROFILES TABLOSU
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'employee', 'admin')),
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

-- REQUEST ASSIGNMENTS TABLOSU
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

CREATE POLICY "Users can view own profile or admins view all"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==========================================
-- CLEANING REQUESTS RLS POLİTİKALARI
-- ==========================================

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

CREATE POLICY "Customers can update own requests"
  ON cleaning_requests FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can update all requests"
  ON cleaning_requests FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

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

CREATE POLICY "Only admins can delete requests"
  ON cleaning_requests FOR DELETE
  TO authenticated
  USING (is_admin());

-- ==========================================
-- REQUEST ASSIGNMENTS RLS POLİTİKALARI
-- ==========================================

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

CREATE POLICY "Only admins can create assignments"
  ON request_assignments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Employees can update own assignments"
  ON request_assignments FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can update all assignments"
  ON request_assignments FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete assignments"
  ON request_assignments FOR DELETE
  TO authenticated
  USING (is_admin());