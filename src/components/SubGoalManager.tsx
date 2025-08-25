import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, List, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SubGoal {
  id: string;
  title: string;
  description?: string;
  status: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  main_goal_id?: string;
}

interface SubGoalDependency {
  id: string;
  sub_goal_id: string;
  depends_on_sub_goal_id: string;
}

interface SubGoalManagerProps {
  mainGoalId: string;
  onSubGoalsUpdate: () => void;
}

export function SubGoalManager({ mainGoalId, onSubGoalsUpdate }: SubGoalManagerProps) {
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [dependencies, setDependencies] = useState<SubGoalDependency[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [newSubGoal, setNewSubGoal] = useState({ title: "", description: "" });
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortedOrder, setSortedOrder] = useState<SubGoal[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSubGoals();
    fetchDependencies();
  }, [mainGoalId]);

  const fetchSubGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_goals')
        .select('*')
        .eq('main_goal_id', mainGoalId)
        .order('order_index');

      if (error) throw error;
      setSubGoals(data || []);
    } catch (error) {
      console.error('Error fetching sub goals:', error);
    }
  };

  const fetchDependencies = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_goal_dependencies')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setDependencies(data || []);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    }
  };

  const topologicalSort = (goals: SubGoal[], deps: SubGoalDependency[]): SubGoal[] => {
    const graph: { [key: string]: string[] } = {};
    const inDegree: { [key: string]: number } = {};
    
    // Initialize graph and in-degree
    goals.forEach(goal => {
      graph[goal.id] = [];
      inDegree[goal.id] = 0;
    });

    // Build graph and calculate in-degrees
    deps.forEach(dep => {
      if (graph[dep.depends_on_sub_goal_id] && inDegree[dep.sub_goal_id] !== undefined) {
        graph[dep.depends_on_sub_goal_id].push(dep.sub_goal_id);
        inDegree[dep.sub_goal_id]++;
      }
    });

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Add nodes with no dependencies
    Object.entries(inDegree).forEach(([nodeId, degree]) => {
      if (degree === 0) queue.push(nodeId);
    });

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      result.push(currentId);

      graph[currentId].forEach(neighborId => {
        inDegree[neighborId]--;
        if (inDegree[neighborId] === 0) {
          queue.push(neighborId);
        }
      });
    }

    // Return sorted goals
    return result.map(id => goals.find(goal => goal.id === id)!).filter(Boolean);
  };

  const handleCreateSubGoal = async () => {
    if (!user || !newSubGoal.title.trim()) return;

    setLoading(true);
    try {
      const { data: createdSubGoal, error: subGoalError } = await supabase
        .from('sub_goals')
        .insert({
          main_goal_id: mainGoalId,
          title: newSubGoal.title.trim(),
          description: newSubGoal.description.trim() || null,
          user_id: user.id,
          order_index: subGoals.length
        })
        .select()
        .single();

      if (subGoalError) throw subGoalError;

      // Create dependencies
      if (selectedDependencies.length > 0) {
        const dependencyInserts = selectedDependencies.map(depId => ({
          sub_goal_id: createdSubGoal.id,
          depends_on_sub_goal_id: depId,
          user_id: user.id
        }));

        const { error: depError } = await supabase
          .from('sub_goal_dependencies')
          .insert(dependencyInserts);

        if (depError) throw depError;
      }

      toast({
        title: "Success",
        description: "Sub-goal created successfully!",
      });

      setNewSubGoal({ title: "", description: "" });
      setSelectedDependencies([]);
      setShowCreateDialog(false);
      fetchSubGoals();
      fetchDependencies();
      onSubGoalsUpdate();
    } catch (error) {
      console.error('Error creating sub goal:', error);
      toast({
        title: "Error",
        description: "Failed to create sub-goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubGoalStatus = async (subGoalId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sub_goals')
        .update({ status: newStatus })
        .eq('id', subGoalId);

      if (error) throw error;

      fetchSubGoals();
      onSubGoalsUpdate();
      
      toast({
        title: "Success",
        description: "Sub-goal status updated!",
      });
    } catch (error) {
      console.error('Error updating sub goal status:', error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const handleShowOrder = () => {
    const sorted = topologicalSort(subGoals, dependencies);
    setSortedOrder(sorted);
    setShowOrderDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in_progress': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      default: return 'Todo';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Sub-Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Sub-Goal</DialogTitle>
              <DialogDescription>
                Add a new sub-goal and set its dependencies.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subgoal-title">Sub-Goal Title</Label>
                <Input
                  id="subgoal-title"
                  value={newSubGoal.title}
                  onChange={(e) => setNewSubGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Mathematics Fundamentals"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subgoal-description">Description (optional)</Label>
                <Textarea
                  id="subgoal-description"
                  value={newSubGoal.description}
                  onChange={(e) => setNewSubGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this sub-goal..."
                  className="resize-none"
                />
              </div>
              {subGoals.length > 0 && (
                <div className="space-y-2">
                  <Label>Dependencies (optional)</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {subGoals.map(subGoal => (
                      <div key={subGoal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dep-${subGoal.id}`}
                          checked={selectedDependencies.includes(subGoal.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDependencies(prev => [...prev, subGoal.id]);
                            } else {
                              setSelectedDependencies(prev => prev.filter(id => id !== subGoal.id));
                            }
                          }}
                        />
                        <Label htmlFor={`dep-${subGoal.id}`} className="text-sm">
                          {subGoal.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubGoal} disabled={loading || !newSubGoal.title.trim()}>
                {loading ? "Creating..." : "Create Sub-Goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {subGoals.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleShowOrder}>
            <List className="h-4 w-4 mr-2" />
            See Order
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {subGoals.map((subGoal) => (
          <Card key={subGoal.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{subGoal.title}</CardTitle>
                  {subGoal.description && (
                    <p className="text-sm text-muted-foreground mt-1">{subGoal.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className={getStatusColor(subGoal.status)}>
                  {getStatusLabel(subGoal.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={subGoal.status === 'todo' ? 'default' : 'outline'}
                  onClick={() => updateSubGoalStatus(subGoal.id, 'todo')}
                >
                  Todo
                </Button>
                <Button
                  size="sm"
                  variant={subGoal.status === 'in_progress' ? 'default' : 'outline'}
                  onClick={() => updateSubGoalStatus(subGoal.id, 'in_progress')}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={subGoal.status === 'completed' ? 'default' : 'outline'}
                  onClick={() => updateSubGoalStatus(subGoal.id, 'completed')}
                >
                  Completed
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Recommended Completion Order</DialogTitle>
            <DialogDescription>
              Based on dependencies, here's the optimal order to complete your sub-goals:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sortedOrder.map((subGoal, index) => (
              <div key={subGoal.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{subGoal.title}</h4>
                  {subGoal.description && (
                    <p className="text-sm text-muted-foreground">{subGoal.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className={getStatusColor(subGoal.status)}>
                  {getStatusLabel(subGoal.status)}
                </Badge>
                {index < sortedOrder.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowOrderDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}