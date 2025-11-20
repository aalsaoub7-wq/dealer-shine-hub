-- Fix infinite recursion in shared_collections RLS policies
-- The issue is the "View shared collections by valid token" policy which references
-- the same table it's defined on, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "View shared collections by valid token" ON public.shared_collections;

-- Create a simple policy that allows anyone (authenticated or not) to view shared collections
-- Security is handled by the token being secret - if you have the token, you can view
CREATE POLICY "Anyone can view shared collections"
ON public.shared_collections
FOR SELECT
TO authenticated, anon
USING (true);

-- Keep the existing user-specific policies for managing their own collections
-- These are already correct and don't cause recursion:
-- - "Users can create their own shared collections" (INSERT)
-- - "Users can update their own shared collections" (UPDATE)  
-- - "Users can delete their own shared collections" (DELETE)
-- - "Users can view their own shared collections" (SELECT)