-- Update the handle_new_user function to include timezone from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, timezone)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'timezone', 'UTC')
  );
  RETURN new;
END;
$$;