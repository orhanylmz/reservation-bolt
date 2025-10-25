/*
  # Remove is_admin() from request_assignments SELECT policy

  1. Problem
    - Even with SECURITY DEFINER, is_admin() in policies can cause issues
    - Employees cannot see their assignments
    
  2. Solution
    - Remove is_admin() check from request_assignments SELECT policy
    - Employees can only see their own assignments
    - Admins will use a separate query pattern in the admin dashboard
    
  3. Security
    - Employees can ONLY see assignments where employee_id = their auth.uid()
    - This is the most secure and performant approach
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Employees can view own assignments" ON request_assignments;

-- Create new SELECT policy without is_admin()
CREATE POLICY "Employees can view own assignments"
  ON request_assignments
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Also update profiles SELECT policy to avoid potential issues
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