/*
  # Use SECURITY DEFINER function to break circular dependency

  1. Problem
    - Circular dependency when policies reference each other
    - is_admin() function creates recursion

  2. Solution
    - Create a SECURITY DEFINER function that bypasses RLS
    - Use this function in policies to check admin status
    - This breaks the circular dependency

  3. Security
    - Function runs with elevated privileges (SECURITY DEFINER)
    - Only checks if current user is admin
    - Safe to use in RLS policies
*/

-- Drop old function
DROP FUNCTION IF EXISTS is_admin();

-- Create new SECURITY DEFINER function that bypasses RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Update profiles SELECT policy
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON profiles;

CREATE POLICY "Users can view own profile or admin can view all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR is_admin()
  );

-- Update request_assignments SELECT policy  
DROP POLICY IF EXISTS "Employees can view own assignments" ON request_assignments;

CREATE POLICY "Employees can view own assignments"
  ON request_assignments
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() OR is_admin()
  );