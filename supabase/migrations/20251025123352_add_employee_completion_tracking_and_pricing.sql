/*
  # Add employee completion tracking and pricing

  1. Changes
    - Add `completed_by_employee` field to request_assignments for tracking individual completions
    - Add `price` field to cleaning_requests for storing calculated price
    - Update request_assignments to track completion status

  2. Pricing Policy
    - Small home: 500 TL base price
    - Medium home: 800 TL base price
    - Large home: 1200 TL base price
    - Additional employee multiplier: 1.5x per extra employee
    - Formula: base_price * (1 + (employee_count - 1) * 0.5)

  3. Security
    - Employees can update their own completion status
*/

-- Add completed_by_employee column to request_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'request_assignments' AND column_name = 'completed_by_employee'
  ) THEN
    ALTER TABLE request_assignments ADD COLUMN completed_by_employee BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add completed_at column to request_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'request_assignments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE request_assignments ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add price column to cleaning_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cleaning_requests' AND column_name = 'price'
  ) THEN
    ALTER TABLE cleaning_requests ADD COLUMN price DECIMAL(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Policy: Employees can update their own completion status
CREATE POLICY "Employees can update own completion"
  ON request_assignments
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());