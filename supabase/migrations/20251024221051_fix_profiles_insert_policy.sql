/*
  # Fix profiles INSERT policy to prevent infinite recursion

  1. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy that doesn't call is_admin() function
    - Allow authenticated users to insert their own profile during registration

  2. Security
    - Users can only insert profile with their own auth.uid()
    - Prevents infinite recursion during registration
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy without function call
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);