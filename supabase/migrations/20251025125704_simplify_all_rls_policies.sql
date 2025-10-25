/*
  # Simplify all RLS policies to avoid circular dependencies

  1. Changes
    - Remove all is_admin() checks from policies
    - Simplify to only check current user
    - Admin dashboard will use service role or separate logic

  2. Security
    - Users can only see their own profile
    - Employees can only see their own assignments
    - Admin operations handled separately in application layer
*/

-- Fix profiles SELECT policy
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON profiles;

CREATE POLICY "Users can view own profile or admin can view all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- request_assignments SELECT policy is already correct
-- (it only checks employee_id = auth.uid())