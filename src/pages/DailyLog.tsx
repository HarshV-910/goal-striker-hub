import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Target, Calendar, Save, CheckCircle, Clock, AlertCircle, Plus, X, Eye, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
  const [todayGoals, setTodayGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showViewLogs, setShowViewLogs] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [viewLogData, setViewLogData] = useState<string>('');
  const [loadingViewLog, setLoadingViewLog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDailyLog();
      fetchTodayGoals();
    }
  }, [user]);

  const fetchTodayGoals = async () => {
    try {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('tomorrow_goals')
        .eq('user_id', user?.id)
        .eq('log_date', yesterday)
        .maybeSingle();

      if (error) throw error;
      setTodayGoals(data?.tomorrow_goals || []);
    } catch (error) {
      console.error('Error fetching today goals:', error);
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

  const addTomorrowGoal = () => {
    if (newGoal.trim()) {
      setDailyLog(prev => ({
        ...prev,
        tomorrow_goals: [...prev.tomorrow_goals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeTomorrowGoal = (index: number) => {
    setDailyLog(prev => ({
      ...prev,
      tomorrow_goals: prev.tomorrow_goals.filter((_, i) => i !== index)
    }));
  };

  const removeTodayGoal = (index: number) => {
    setTodayGoals(prev => prev.filter((_, i) => i !== index));
  };

  const fetchLogForDate = async (date: Date) => {
    if (!user) return;
    
    setLoadingViewLog(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('what_learned_today')
        .eq('user_id', user.id)
        .eq('log_date', formattedDate)
        .maybeSingle();

      if (error) throw error;
      
      setViewLogData(data?.what_learned_today || 'No learning notes found for this date.');
    } catch (error) {
      console.error('Error fetching log for date:', error);
      setViewLogData('Error loading learning notes for this date.');
    } finally {
      setLoadingViewLog(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      fetchLogForDate(date);
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
        <div className="flex gap-2">
          <Dialog open={showViewLogs} onOpenChange={setShowViewLogs}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>View Learning Logs</DialogTitle>
                <DialogDescription>
                  Select a date to view what you learned that day
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto p-3 bg-background"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {selectedDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Learning Notes for {format(selectedDate, "MMMM dd, yyyy")}
                    </label>
                    <div className="min-h-[200px] p-3 border rounded-lg bg-muted/50">
                      {loadingViewLog ? (
                        <p className="text-muted-foreground">Loading...</p>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">
                          {viewLogData}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={saveDailyLog} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Log"}
          </Button>
        </div>
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
            <CardDescription>Goals set yesterday for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayGoals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No temporary goals set for today
              </p>
            ) : (
              <div className="space-y-2">
                {todayGoals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{goal}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTodayGoal(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
            <CardDescription>Set goals for tomorrow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a goal for tomorrow..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTomorrowGoal()}
                />
                <Button onClick={addTomorrowGoal} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {dailyLog.tomorrow_goals.length > 0 && (
                <div className="space-y-2">
                  {dailyLog.tomorrow_goals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{goal}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTomorrowGoal(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Goals for tomorrow: {dailyLog.tomorrow_goals.length}
              </div>
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
                {todayGoals.length}
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