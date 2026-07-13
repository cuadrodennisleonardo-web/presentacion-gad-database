-- Fix RLS for notifications to allow any authenticated user to create notifications

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Superadmins can create notifications" ON public.notifications;

-- Create a new permissive policy for inserting notifications
CREATE POLICY "Anyone can create notifications" 
    ON public.notifications 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
