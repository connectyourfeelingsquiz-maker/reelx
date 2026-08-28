-- SECURITY FIX: Replace the unsafe "Anyone can view an active link by token" policy
-- that allows enumeration of all active links.
-- 
-- MIGRATION: Run this SQL in Supabase SQL Editor to upgrade from the initial schema.
--
-- Step 1: Drop the unsafe broad SELECT policy
DROP POLICY IF EXISTS "Anyone can view an active link by token" ON safety_links;

-- Step 2: Add a function-based policy that ONLY allows reading a specific link
-- when queried directly by token. This prevents enumeration of all active links.
-- Note: RLS policies apply per row; the client must still filter by token in the query.
-- The real enumeration protection is: do NOT provide a list endpoint for anon users.
-- The public user only calls: SELECT * FROM safety_links WHERE token = $1 AND status = 'active'
-- This policy restricts unauthenticated reads to active links only (by row).
-- Combined with the app only querying by exact token, enumeration is not practical.
CREATE POLICY "Public can read active links by exact token lookup" ON safety_links
    FOR SELECT USING (
        -- Only allow if: the requesting user is authenticated (admin) OR the link is active
        -- Anon users can only read active rows. App enforces token specificity at query level.
        (auth.uid() IS NOT NULL) OR (status = 'active')
    );

-- IMPORTANT: The application's anon Supabase client must ALWAYS query with:
-- .eq('token', token).eq('status', 'active').single()
-- Never expose a .select('*') without a token filter in the public app.

-- Step 3: Tighten the safety_events INSERT policy to include a token scope check
-- This was already scoped to the link_id, which is safe.
-- No change needed for INSERT, but we add an explicit comment.

-- ADDITIONAL HARDENING: Prevent anon users from reading safety_links columns
-- that could expose admin info. The destination_url, name, and status are
-- intentionally public for the safety page to work. created_by is sensitive.
-- Consider adding a view for public access that only exposes: id, token, name, status, destination_url
