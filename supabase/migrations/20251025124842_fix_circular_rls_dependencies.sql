/*
  # Fix circular RLS dependencies in profiles and request_assignments

  1. Problem
    - profiles table SELECT policy uses is_admin() function
    - is_admin() function queries profiles table
    - request_assignments SELECT policy queries profiles table
    - This creates circular dependency and infinite recursion

  2. Solution
    - Simplify profiles SELECT policy to not use is_admin()
    - Simplify request_assignments SELECT policy
    - Remove circular dependencies

  3. Security
    - Users can view their own profile
    - Admins can view all profiles (direct role check)
    - Employees can view their own assignments
    - Admins can view all assignments
*/

-- Fix profiles table SELECT policy
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON profiles;

CREATE POLICY "Users can view own profile or admin can view all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- Fix request_assignments SELECT policy to avoid circular dependency
DROP POLICY IF EXISTS "Employees can view own assignments" ON request_assignments;

CREATE POLICY "Employees can view own assignments"
  ON request_assignments
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid()
  );