import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, Target, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, addDays } from 'date-fns';

interface DailyLogData {
  id?: string;
  log_date: string;
  what_learned_today?: string;
  today_goals?: string[];
  tomorrow_goals?: string[];
  learning_notes?: string;
  temporary_goal?: string;
}

const DailyLog = () => {
  const [currentLog, setCurrentLog] = useState<DailyLogData>({
    log_date: format(new Date(), 'yyyy-MM-dd'),
    today_goals: [],
    tomorrow_goals: []
  });
  const [whatLearned, setWhatLearned] = useState('');
  const [newTodayGoal, setNewTodayGoal] = useState('');
  const [newTomorrowGoal, setNewTomorrowGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTodayLog();
    }
  }, [user]);

  const fetchTodayLog = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      // Get today's log
      const { data: todayLog, error: todayError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user?.id)
        .eq('log_date', today)
        .maybeSingle();

      if (todayError) throw todayError;

      // Get yesterday's log to move tomorrow goals to today
      const { data: yesterdayLog, error: yesterdayError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user?.id)
        .eq('log_date', yesterday)
        .maybeSingle();

      if (yesterdayError) throw yesterdayError;

      if (todayLog) {
        // Log exists for today
        setCurrentLog(todayLog);
        setWhatLearned(todayLog.what_learned_today || '');
      } else {
        // Create new log, possibly with yesterday's tomorrow goals
        const initialTodayGoals = yesterdayLog?.tomorrow_goals || [];
        
        const newLog: DailyLogData = {
          log_date: today,
          what_learned_today: '',
          today_goals: initialTodayGoals,
          tomorrow_goals: [],
          learning_notes: '',
          temporary_goal: ''
        };

        // Create the log entry in database
        const { data: createdLog, error: createError } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user?.id,
            log_date: today,
            today_goals: initialTodayGoals,
            tomorrow_goals: [],
            what_learned_today: '',
            learning_notes: '',
            temporary_goal: ''
          })
          .select()
          .single();

        if (createError) throw createError;

        setCurrentLog(createdLog);
      }
    } catch (error) {
      console.error('Error fetching daily log:', error);
      toast({
        title: "Error",
        description: "Failed to load daily log.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLog = async () => {
    if (!user || !currentLog.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('daily_logs')
        .update({
          what_learned_today: whatLearned,
          today_goals: currentLog.today_goals,
          tomorrow_goals: currentLog.tomorrow_goals,
          learning_notes: whatLearned, // keeping for backward compatibility
        })
        .eq('id', currentLog.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily log saved successfully!",
      });
    } catch (error) {
      console.error('Error saving daily log:', error);
      toast({
        title: "Error",
        description: "Failed to save daily log.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addTodayGoal = () => {
    if (!newTodayGoal.trim()) return;
    
    setCurrentLog(prev => ({
      ...prev,
      today_goals: [...(prev.today_goals || []), newTodayGoal.trim()]
    }));
    setNewTodayGoal('');
  };

  const removeTodayGoal = (index: number) => {
    setCurrentLog(prev => ({
      ...prev,
      today_goals: prev.today_goals?.filter((_, i) => i !== index) || []
    }));
  };

  const addTomorrowGoal = () => {
    if (!newTomorrowGoal.trim()) return;
    
    setCurrentLog(prev => ({
      ...prev,
      tomorrow_goals: [...(prev.tomorrow_goals || []), newTomorrowGoal.trim()]
    }));
    setNewTomorrowGoal('');
  };

  const removeTomorrowGoal = (index: number) => {
    setCurrentLog(prev => ({
      ...prev,
      tomorrow_goals: prev.tomorrow_goals?.filter((_, i) => i !== index) || []
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Daily Log</h1>
          <p className="text-muted-foreground">Loading your daily log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Log</h1>
          <p className="text-muted-foreground">Track your daily progress and activities</p>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
          </div>
        </div>
        <Button onClick={saveLog} disabled={saving}>
          {saving ? "Saving..." : "Save Log"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* What I Learned Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              What I Learned Today
            </CardTitle>
            <CardDescription>
              Record the topics and skills you learned today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learned">Learning Summary</Label>
              <Textarea
                id="learned"
                value={whatLearned}
                onChange={(e) => setWhatLearned(e.target.value)}
                placeholder="Describe what you learned today..."
                className="min-h-[150px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Today's Goals
            </CardTitle>
            <CardDescription>
              Goals you want to accomplish today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTodayGoal}
                onChange={(e) => setNewTodayGoal(e.target.value)}
                placeholder="Add a goal for today..."
                onKeyPress={(e) => e.key === 'Enter' && addTodayGoal()}
              />
              <Button size="sm" onClick={addTodayGoal} disabled={!newTodayGoal.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentLog.today_goals?.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span className="text-sm flex-1">{goal}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTodayGoal(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!currentLog.today_goals || currentLog.today_goals.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No goals set for today
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tomorrow's Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tomorrow's Goals
            </CardTitle>
            <CardDescription>
              Plan your goals for tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTomorrowGoal}
                onChange={(e) => setNewTomorrowGoal(e.target.value)}
                placeholder="Add a goal for tomorrow..."
                onKeyPress={(e) => e.key === 'Enter' && addTomorrowGoal()}
              />
              <Button size="sm" onClick={addTomorrowGoal} disabled={!newTomorrowGoal.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentLog.tomorrow_goals?.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span className="text-sm flex-1">{goal}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTomorrowGoal(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!currentLog.tomorrow_goals || currentLog.tomorrow_goals.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No goals set for tomorrow
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
          <CardDescription>Overview of your daily activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentLog.today_goals?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Today's Goals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentLog.tomorrow_goals?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Tomorrow's Goals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {whatLearned.length}
              </div>
              <p className="text-sm text-muted-foreground">Characters Learned</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyLog;