-- First, let's add the reminder columns to the goals table
ALTER TABLE public.goals 
ADD COLUMN reminder_options TEXT[] DEFAULT NULL;

-- Add timezone column to profiles table if it doesn't exist
-- (checking if column exists first)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='timezone') THEN
        ALTER TABLE public.profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
END $$;