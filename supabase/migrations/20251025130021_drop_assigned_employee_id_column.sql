/*
  # Drop assigned_employee_id column

  1. Changes
    - Remove assigned_employee_id column from cleaning_requests table
    - This column is no longer needed
    - All employee assignments now tracked in request_assignments table
    
  2. Note
    - All RLS policies updated to use request_assignments
    - No data loss - assignments preserved in request_assignments
*/

ALTER TABLE cleaning_requests
DROP COLUMN assigned_employee_id;