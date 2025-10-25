/*
  # Fix request_assignments RLS policy to avoid infinite recursion

  1. Changes
    - Drop existing SELECT policy that uses is_admin() function
    - Create new SELECT policy without function call
    - Allow employees to view their own assignments
    - Allow admins to view all assignments (using direct role check)

  2. Security
    - Employees can only see assignments where they are the employee
    - Admins can see all assignments
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Employees can view own assignments" ON request_assignments;

-- Create new SELECT policy without function call
CREATE POLICY "Employees can view own assignments"
  ON request_assignments
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );