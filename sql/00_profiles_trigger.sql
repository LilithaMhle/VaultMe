-- Drop existing trigger/function if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to populate profiles with signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, role, location, linkedin, github, bio, profile_photo, cv, cv_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.user_metadata->>'full_name'),
    COALESCE(NEW.raw_user_meta_data->>'role', NEW.user_metadata->>'role'),
    COALESCE(NEW.raw_user_meta_data->>'location', NEW.user_metadata->>'location'),
    COALESCE(NEW.raw_user_meta_data->>'linkedin', NEW.user_metadata->>'linkedin'),
    COALESCE(NEW.raw_user_meta_data->>'github', NEW.user_metadata->>'github'),
    COALESCE(NEW.raw_user_meta_data->>'bio', NEW.user_metadata->>'bio'),
    COALESCE(NEW.raw_user_meta_data->>'profile_photo', NEW.user_metadata->>'profile_photo'),
    COALESCE(NEW.raw_user_meta_data->>'cv', NEW.user_metadata->>'cv'),
    COALESCE(NEW.raw_user_meta_data->>'cv_name', NEW.user_metadata->>'cv_name')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
