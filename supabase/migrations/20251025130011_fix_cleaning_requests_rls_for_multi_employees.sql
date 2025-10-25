/*
  # Fix cleaning_requests RLS policies for multi-employee support

  1. Changes
    - Update SELECT policy to use request_assignments table
    - Update employee UPDATE policy to use request_assignments table
    - Remove dependency on assigned_employee_id column
    
  2. Security
    - Customers can view their own requests
    - Employees can view requests assigned to them (via request_assignments)
    - Admins can view all requests
    - Employees can update requests assigned to them (via request_assignments)
*/

-- Drop policies that depend on assigned_employee_id
DROP POLICY IF EXISTS "Customers can view own requests" ON cleaning_requests;
DROP POLICY IF EXISTS "Employees can update assigned requests" ON cleaning_requests;

-- Recreate SELECT policy without assigned_employee_id
CREATE POLICY "Customers can view own requests"
  ON cleaning_requests
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM request_assignments
      WHERE request_assignments.request_id = cleaning_requests.id
      AND request_assignments.employee_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Recreate employee UPDATE policy without assigned_employee_id
CREATE POLICY "Employees can update assigned requests"
  ON cleaning_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM request_assignments
      WHERE request_assignments.request_id = cleaning_requests.id
      AND request_assignments.employee_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM request_assignments
      WHERE request_assignments.request_id = cleaning_requests.id
      AND request_assignments.employee_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );