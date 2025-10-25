/*
  # Simplify request_assignments RLS policies

  1. Changes
    - Drop and recreate SELECT policy with simpler logic
    - Remove nested EXISTS that references profiles table
    - Keep admin check but avoid circular dependency

  2. Security
    - Employees can view assignments where employee_id matches their auth.uid()
    - Admins can view all assignments
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Employees can view own assignments" ON request_assignments;

-- Create simpler SELECT policy
-- Note: We check admin role using a direct subquery
CREATE POLICY "Employees can view own assignments"
  ON request_assignments
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() 
    OR 
    auth.jwt() ->> 'role' = 'admin'
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );