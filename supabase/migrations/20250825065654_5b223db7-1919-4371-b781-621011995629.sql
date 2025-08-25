-- Update goals table to support better goal management
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS is_main_goal BOOLEAN DEFAULT true;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS deadline DATE;

-- Create sub_goals table for better sub-goal management
CREATE TABLE IF NOT EXISTS public.sub_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_goal_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- Enable RLS for sub_goals
ALTER TABLE public.sub_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for sub_goals
CREATE POLICY "Users can manage their own sub goals" 
ON public.sub_goals 
FOR ALL 
USING (auth.uid() = user_id);

-- Create sub_goal_dependencies table for dependency tracking
CREATE TABLE IF NOT EXISTS public.sub_goal_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_goal_id UUID NOT NULL,
  depends_on_sub_goal_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS for sub_goal_dependencies
ALTER TABLE public.sub_goal_dependencies ENABLE ROW LEVEL SECURITY;

-- Create policies for sub_goal_dependencies
CREATE POLICY "Users can manage dependencies for their sub goals" 
ON public.sub_goal_dependencies 
FOR ALL 
USING (auth.uid() = user_id);

-- Update daily_logs table structure
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS what_learned_today TEXT;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS today_goals TEXT[];
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS tomorrow_goals TEXT[];

-- Add trigger for automatic timestamp updates on sub_goals
CREATE TRIGGER update_sub_goals_updated_at
BEFORE UPDATE ON public.sub_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraints to ensure valid status values
ALTER TABLE public.sub_goals ADD CONSTRAINT valid_status CHECK (status IN ('todo', 'in_progress', 'completed'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_goals_main_goal_id ON public.sub_goals(main_goal_id);
CREATE INDEX IF NOT EXISTS idx_sub_goals_user_id ON public.sub_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_goal_dependencies_sub_goal_id ON public.sub_goal_dependencies(sub_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON public.goals(deadline);
CREATE INDEX IF NOT EXISTS idx_daily_logs_log_date ON public.daily_logs(log_date);