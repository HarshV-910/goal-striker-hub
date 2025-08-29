import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import { CalendarDays, Target, Clock, CheckCircle } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  status: string;
  progress_percentage: number;
}

const Calendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, description, deadline, status, progress_percentage')
        .eq('user_id', user?.id)
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalsForDate = (date: Date) => {
    return goals.filter(goal => {
      if (!goal.deadline) return false;
      const goalDate = parseISO(goal.deadline);
      return format(goalDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in_progress': return 'bg-primary text-primary-foreground';
      case 'todo': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'todo': return <Target className="h-4 w-4" />;
      default: return <CalendarDays className="h-4 w-4" />;
    }
  };

  const isOverdue = (deadline: string, status: string) => {
    if (status === 'completed') return false;
    return isBefore(parseISO(deadline), startOfDay(new Date()));
  };

  const selectedDateGoals = selectedDate ? getGoalsForDate(selectedDate) : [];
  const upcomingGoals = goals.filter(goal => goal.deadline && !isBefore(parseISO(goal.deadline), startOfDay(new Date()))).slice(0, 5);
  const overdueGoals = goals.filter(goal => goal.deadline && isOverdue(goal.deadline, goal.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">View your goals and deadlines in calendar format</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Goal Calendar
            </CardTitle>
            <CardDescription>Click on a date to see goals with deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasGoals: (date) => getGoalsForDate(date).length > 0,
                hasOverdue: (date) => getGoalsForDate(date).some(goal => goal.deadline && isOverdue(goal.deadline, goal.status)),
                hasCompleted: (date) => getGoalsForDate(date).some(goal => goal.status === 'completed'),
              }}
              modifiersStyles={{
                hasGoals: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                },
                hasOverdue: { 
                  backgroundColor: 'hsl(var(--destructive))', 
                  color: 'hsl(var(--destructive-foreground))'
                },
                hasCompleted: { 
                  backgroundColor: 'hsl(var(--success))', 
                  color: 'hsl(var(--success-foreground))'
                },
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDateGoals.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No goals scheduled for this date</p>
                ) : (
                  selectedDateGoals.map((goal) => (
                    <div key={goal.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">{goal.title}</h4>
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(goal.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(goal.status)}
                            {goal.status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{goal.progress_percentage}%</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
              <CardDescription>Next 5 goals with deadlines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingGoals.length === 0 ? (
                <p className="text-muted-foreground text-sm">No upcoming deadlines</p>
              ) : (
                upcomingGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.deadline && format(parseISO(goal.deadline), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(goal.status)}`}>
                      {getStatusIcon(goal.status)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {overdueGoals.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Overdue Goals</CardTitle>
                <CardDescription>Goals that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-2 border border-destructive/20 rounded bg-destructive/5">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{goal.title}</p>
                      <p className="text-xs text-destructive">
                        Due: {goal.deadline && format(parseISO(goal.deadline), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;