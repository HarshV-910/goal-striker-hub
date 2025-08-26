import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Calendar, Save, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface DailyLog {
  id?: string;
  log_date: string;
  what_learned_today?: string;
  tomorrow_goals: string[];
  learning_notes?: string;
  temporary_goal?: string;
}

interface Goal {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const DailyLog = () => {
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    log_date: format(new Date(), 'yyyy-MM-dd'),
    what_learned_today: '',
    tomorrow_goals: [],
    learning_notes: '',
    temporary_goal: ''
  });
  const [yesterdayGoals, setYesterdayGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDailyLog();
      fetchYesterdayGoals();
    }
  }, [user]);

  const fetchYesterdayGoals = async () => {
    try {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, status, created_at')
        .eq('user_id', user?.id)
        .gte('created_at', yesterday)
        .lt('created_at', format(new Date(), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setYesterdayGoals(data || []);
    } catch (error) {
      console.error('Error fetching yesterday goals:', error);
    }
  };

  const fetchDailyLog = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user?.id)
        .eq('log_date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDailyLog(data);
      }
    } catch (error) {
      console.error('Error fetching daily log:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDailyLog = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const logData = {
        user_id: user.id,
        log_date: dailyLog.log_date,
        what_learned_today: dailyLog.what_learned_today || null,
        tomorrow_goals: dailyLog.tomorrow_goals,
        learning_notes: dailyLog.learning_notes || null,
        temporary_goal: dailyLog.temporary_goal || null
      };

      const { error } = await supabase
        .from('daily_logs')
        .upsert(logData, {
          onConflict: 'user_id,log_date'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily log saved successfully!",
      });
    } catch (error) {
      console.error('Error saving daily log:', error);
      toast({
        title: "Error",
        description: "Failed to save daily log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10';
      case 'in_progress': return 'text-primary bg-primary/10';
      default: return 'text-muted-foreground bg-muted';
    }
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
        <Button onClick={saveDailyLog} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
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
            <CardDescription>Record the topics and skills you learned today</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe what you learned today..."
              value={dailyLog.what_learned_today || ''}
              onChange={(e) => setDailyLog(prev => ({
                ...prev,
                what_learned_today: e.target.value
              }))}
              className="min-h-[200px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Today's Goals from Yesterday */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Today's Goals
            </CardTitle>
            <CardDescription>Goals created yesterday for today</CardDescription>
          </CardHeader>
          <CardContent>
            {yesterdayGoals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No goals were created yesterday for today
              </p>
            ) : (
              <div className="space-y-2">
                {yesterdayGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>{getStatusIcon(goal.status)}</div>
                      <span className="font-medium">{goal.title}</span>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tomorrow's Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tomorrow's Goals
            </CardTitle>
            <CardDescription>Plan your goals for tomorrow</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter tomorrow's goals (one per line)..."
              value={dailyLog.tomorrow_goals.join('\n')}
              onChange={(e) => setDailyLog(prev => ({
                ...prev,
                tomorrow_goals: e.target.value.split('\n').filter(goal => goal.trim())
              }))}
              className="min-h-[200px] resize-none"
            />
            <div className="text-sm text-muted-foreground mt-2">
              Goals for tomorrow: {dailyLog.tomorrow_goals.length}
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
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {yesterdayGoals.length}
              </div>
              <p className="text-sm text-muted-foreground">Today's Goals</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {dailyLog.tomorrow_goals.length}
              </div>
              <p className="text-sm text-muted-foreground">Tomorrow's Goals</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {dailyLog.what_learned_today?.length || 0}
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