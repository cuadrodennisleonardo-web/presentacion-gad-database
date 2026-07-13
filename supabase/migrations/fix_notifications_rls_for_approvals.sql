-- Relax notifications INSERT policy so Department Admins can send approval requests to Superadmins
DROP POLICY IF EXISTS "Users can create own notifications or superadmin can create any" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Superadmins can create notifications" ON public.notifications;

-- Allow any authenticated user to create notifications (needed for approval requests to superadmins)
CREATE POLICY "Anyone can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
