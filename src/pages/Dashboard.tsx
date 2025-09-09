import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Calendar, BookOpen, Plus, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Goal {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface DashboardStats {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  todoGoals: number;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    todoGoals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dailyQuote, setDailyQuote] = useState<string>('');
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchDailyQuote();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserName(data?.full_name || '');
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchDailyQuote = async () => {
    try {
      setQuoteLoading(true);
      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: {
          message: 'Generate a single inspirational quote about study, concentration, motivation, or an interesting fact. Keep it under 100 characters. Only return the quote, nothing else.',
          context: 'Daily motivational quote generator',
          conversationHistory: []
        }
      });

      if (error) {
        console.error('Error fetching quote:', error);
        setDailyQuote('Stay focused, stay determined. Success is a journey, not a destination.');
      } else {
        setDailyQuote(data.generatedText || 'Stay focused, stay determined. Success is a journey, not a destination.');
      }
    } catch (error) {
      console.error('Error fetching daily quote:', error);
      setDailyQuote('Stay focused, stay determined. Success is a journey, not a destination.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals(goalsData || []);
      
      // Calculate stats
      const totalGoals = goalsData?.length || 0;
      const completedGoals = goalsData?.filter(g => g.status === 'completed').length || 0;
      const inProgressGoals = goalsData?.filter(g => g.status === 'in_progress').length || 0;
      const todoGoals = goalsData?.filter(g => g.status === 'todo').length || 0;

      setStats({
        totalGoals,
        completedGoals,
        inProgressGoals,
        todoGoals,
      });
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = stats.totalGoals > 0 
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100) 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'in_progress':
        return 'bg-primary';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Todo';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Daily Quote Section */}
      <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Quote className="h-6 w-6 text-primary flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">Today's Quote</h3>
              {quoteLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-base leading-relaxed">
                  "{dailyQuote}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{userName ? `, ${userName}` : ''}! 
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your goal tracking overview
          </p>
        </div>
        <Button 
          onClick={() => navigate('/goals')}
          className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completedGoals}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgressGoals}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Todo</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.todoGoals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            Your goal completion progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Goals */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Recent Goals</CardTitle>
          <CardDescription>
            Your latest goals and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No goals yet. Create your first goal to get started!</p>
              <Button 
                onClick={() => navigate('/goals')}
                className="mt-4"
              >
                Create Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(goal.status)}`} />
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(goal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {getStatusLabel(goal.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;