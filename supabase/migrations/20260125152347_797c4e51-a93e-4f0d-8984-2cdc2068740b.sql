-- Create a trigger to automatically assign admin role to the first user who signs up
-- or to any user who signs up (for now, since this is a single-admin shop)

CREATE OR REPLACE FUNCTION public.handle_new_user_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign admin role to new users (for single-admin shop setup)
  -- In production, you would want more restrictive logic
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users (this requires special handling)
-- We'll use a different approach - create a function that can be called

-- Allow authenticated users to check if they need admin setup
CREATE OR REPLACE FUNCTION public.setup_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if there are any admins
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  -- If no admins exist, make the current user an admin
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
  
  -- Check if current user is already admin
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role = 'admin') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;