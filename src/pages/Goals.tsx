import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreateGoalDialog } from '@/components/CreateGoalDialog';
import { SubGoalManager } from '@/components/SubGoalManager';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Target, CheckCircle, Clock, AlertCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  deadline?: string;
  progress_percentage: number;
  is_main_goal: boolean;
  reminder_options: string[] | null;
}

interface SubGoalStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
}

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subGoalStats, setSubGoalStats] = useState<SubGoalStats>({ total: 0, completed: 0, inProgress: 0, todo: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchSubGoalStats();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_main_goal', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubGoalStats = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_goals')
        .select('status')
        .eq('user_id', user?.id);

      if (error) throw error;

      const stats = (data || []).reduce((acc, subGoal) => {
        acc.total++;
        switch (subGoal.status) {
          case 'completed':
            acc.completed++;
            break;
          case 'in_progress':
            acc.inProgress++;
            break;
          default:
            acc.todo++;
        }
        return acc;
      }, { total: 0, completed: 0, inProgress: 0, todo: 0 });

      setSubGoalStats(stats);
    } catch (error) {
      console.error('Error fetching sub goal stats:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      // First delete all sub-goals for this goal
      const { error: subGoalsError } = await supabase
        .from('sub_goals')
        .delete()
        .eq('main_goal_id', goalId);

      if (subGoalsError) throw subGoalsError;

      // Then delete the main goal
      const { error: goalError } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user?.id);

      if (goalError) throw goalError;

      toast({
        title: "Success",
        description: "Goal deleted successfully!",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateGoalProgress = async (goalId: string) => {
    try {
      // Fetch sub-goals for this goal
      const { data: subGoals, error } = await supabase
        .from('sub_goals')
        .select('status')
        .eq('main_goal_id', goalId);

      if (error) throw error;

      if (subGoals && subGoals.length > 0) {
        const completedCount = subGoals.filter(sg => sg.status === 'completed').length;
        const progressPercentage = (completedCount / subGoals.length) * 100;
        const isCompleted = completedCount === subGoals.length;

        // Update goal progress and status
        const { error: updateError } = await supabase
          .from('goals')
          .update({
            progress_percentage: progressPercentage,
            status: isCompleted ? 'completed' : (completedCount > 0 ? 'in_progress' : 'todo')
          })
          .eq('id', goalId);

        if (updateError) throw updateError;
      }

      fetchGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const toggleGoalExpansion = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      default: return 'Todo';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Manage and track your goals</p>
        </div>
        <CreateGoalDialog onGoalCreated={() => { fetchGoals(); fetchSubGoalStats(); }} />
      </div>

      {/* Sub-Goal Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sub-Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subGoalStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{subGoalStats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{subGoalStats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Todo</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{subGoalStats.todo}</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-4">Create your first goal to start tracking your progress.</p>
              <CreateGoalDialog onGoalCreated={() => { fetchGoals(); fetchSubGoalStats(); }} />
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id}>
              <Collapsible 
                open={expandedGoals.has(goal.id)} 
                onOpenChange={() => toggleGoalExpansion(goal.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{goal.title}</CardTitle>
                          <Badge className={getStatusColor(goal.status)}>
                            {getStatusIcon(goal.status)}
                            <span className="ml-1">{getStatusLabel(goal.status)}</span>
                          </Badge>
                        </div>
                        {goal.description && (
                          <CardDescription className="mt-2">{goal.description}</CardDescription>
                        )}
                        {goal.deadline && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Deadline: {format(new Date(goal.deadline), 'PPP')}
                          </p>
                        )}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{Math.round(goal.progress_percentage)}%</span>
                          </div>
                          <Progress value={goal.progress_percentage} className="h-2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Goal
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{goal.title}"? This will also delete all associated sub-goals. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {expandedGoals.has(goal.id) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <SubGoalManager 
                      mainGoalId={goal.id} 
                      onSubGoalsUpdate={() => { 
                        updateGoalProgress(goal.id); 
                        fetchSubGoalStats(); 
                      }} 
                    />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Goals;