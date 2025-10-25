/*
  # Add employee count and multiple employee assignments

  1. Changes
    - Add `employee_count` field to cleaning_requests table
    - Create new `request_assignments` table for multiple employee assignments
    - Add foreign key constraints for data integrity

  2. Security
    - Enable RLS on request_assignments table
    - Add policies for authenticated users to view their assignments
    - Admin can manage all assignments

  3. Notes
    - Maintains backward compatibility with assigned_employee_id
    - New assignments table handles multiple employees per request
*/

-- Add employee_count column to cleaning_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cleaning_requests' AND column_name = 'employee_count'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN employee_count INTEGER DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Create request_assignments table for multiple employee assignments
CREATE TABLE IF NOT EXISTS request_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES cleaning_requests(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, employee_id)
);

-- Enable RLS
ALTER TABLE request_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can view their own assignments
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

-- Policy: Admins can insert assignments
CREATE POLICY "Admins can create assignments"
  ON request_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete assignments
CREATE POLICY "Admins can delete assignments"
  ON request_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_request_assignments_request_id ON request_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_assignments_employee_id ON request_assignments(employee_id);